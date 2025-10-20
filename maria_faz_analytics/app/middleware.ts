/**
 * Next.js Middleware - Security Layer
 * Applies security headers, rate limiting, IP filtering, and CSRF protection
 */

import { NextRequest, NextResponse } from 'next/server';
import { applySecurityHeaders, applyCORSHeaders, handlePreflight } from '@/lib/security/headers';
import { getClientIP, isIPAllowed, analyzeRequest, trackSuspiciousActivity, logSecurityEvent } from '@/lib/security/ipFilter';
import { rateLimit, createRateLimitResponse } from '@/lib/security/rateLimiter';

/**
 * Middleware configuration
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};

/**
 * Main middleware function
 */
export async function middleware(request: NextRequest) {
  const startTime = Date.now();
  const ip = getClientIP(request);
  const origin = request.headers.get('origin');
  const { pathname } = request.nextUrl;

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return handlePreflight(origin);
  }

  // 1. IP Filtering
  const ipAllowed = await isIPAllowed(ip);
  if (!ipAllowed) {
    await logSecurityEvent('ip_blocked', {
      ip,
      path: pathname,
      method: request.method,
    });

    return new NextResponse(
      JSON.stringify({
        error: 'Access denied',
        code: 'IP_BLOCKED',
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  // 2. Request Analysis for Suspicious Patterns
  const analysis = analyzeRequest(request);
  if (analysis.suspicious) {
    await trackSuspiciousActivity(ip, analysis.reasons.join(', '));

    await logSecurityEvent('suspicious_request', {
      ip,
      path: pathname,
      method: request.method,
      reasons: analysis.reasons,
    });

    // Don't block immediately, but log and track
  }

  // 3. Rate Limiting based on endpoint
  let rateLimitResult = null;

  if (pathname.startsWith('/api/diagnostic') || pathname.includes('diagnostic')) {
    rateLimitResult = await rateLimit(request, 'diagnostic');
  } else if (pathname.startsWith('/api/reports/pdf') || pathname.includes('download')) {
    rateLimitResult = await rateLimit(request, 'pdfDownload');
  } else if (pathname.startsWith('/api/auth/signin') || pathname.includes('login')) {
    rateLimitResult = await rateLimit(request, 'auth');
  } else if (pathname.startsWith('/api/signup') || pathname.includes('signup')) {
    rateLimitResult = await rateLimit(request, 'signup');
  } else if (pathname.startsWith('/api/auth/reset-password')) {
    rateLimitResult = await rateLimit(request, 'passwordReset');
  } else if (pathname.startsWith('/api/')) {
    rateLimitResult = await rateLimit(request, 'api');
  }

  if (rateLimitResult && !rateLimitResult.success) {
    await logSecurityEvent('rate_limit_exceeded', {
      ip,
      path: pathname,
      method: request.method,
      limit: rateLimitResult.limit,
    });

    return createRateLimitResponse(rateLimitResult);
  }

  // 4. Process the request
  let response = NextResponse.next();

  // 5. Apply security headers
  response = applySecurityHeaders(response);

  // 6. Apply CORS headers if needed
  if (origin) {
    response = applyCORSHeaders(response, origin);
  }

  // 7. Add rate limit headers if applicable
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Limit', rateLimitResult.limit.toString());
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
    response.headers.set('X-RateLimit-Reset', rateLimitResult.reset.toString());
  }

  // 8. Add request ID for tracking
  const requestId = crypto.randomUUID();
  response.headers.set('X-Request-ID', requestId);

  // 9. Log request (for API endpoints only)
  if (pathname.startsWith('/api/')) {
    const responseTime = Date.now() - startTime;

    // Don't await to not slow down response
    logSecurityEvent('api_request', {
      requestId,
      ip,
      path: pathname,
      method: request.method,
      userAgent: request.headers.get('user-agent'),
      responseTime,
    }).catch(console.error);
  }

  return response;
}
