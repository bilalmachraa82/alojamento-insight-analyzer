/**
 * Example Secure API Route
 * Demonstrates how to use all security features
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { withRateLimit } from '@/lib/security/rateLimiter';
import { safeValidate, userLoginSchema } from '@/lib/security/validation';
import { sanitizeUserInput, sanitizeEmail } from '@/lib/security/inputSanitizer';
import { verifyAPIKey, sanitizeAPIResponse } from '@/lib/security/apiSecurity';
import { getClientIP, logSecurityEvent } from '@/lib/security/ipFilter';
import { verifyCSRFToken } from '@/lib/security/auth';

/**
 * POST /api/example-secure
 * Example of a fully secured API endpoint
 */
export async function POST(request: NextRequest) {
  return withRateLimit(request, 'api', async () => {
    try {
      const ip = getClientIP(request);

      // 1. Authentication: Check session or API key
      const session = await getServerSession(authOptions);
      const apiKey = request.headers.get('x-api-key');

      let userId: string | undefined;
      let authMethod: 'session' | 'api-key' | null = null;

      if (session?.user?.id) {
        userId = session.user.id;
        authMethod = 'session';
      } else if (apiKey) {
        const apiKeyResult = await verifyAPIKey(apiKey);
        if (!apiKeyResult.valid) {
          await logSecurityEvent('unauthorized_access', {
            ip,
            reason: 'Invalid API key',
            path: '/api/example-secure',
          });

          return NextResponse.json(
            { error: 'Invalid API key' },
            { status: 401 }
          );
        }

        userId = apiKeyResult.userId;
        authMethod = 'api-key';
      } else {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // 2. CSRF Protection (for session-based auth)
      if (authMethod === 'session') {
        const csrfToken = request.headers.get('x-csrf-token');
        const sessionId = request.cookies.get('next-auth.session-token')?.value;

        if (!csrfToken || !sessionId) {
          return NextResponse.json(
            { error: 'CSRF token required' },
            { status: 403 }
          );
        }

        const csrfValid = await verifyCSRFToken(sessionId, csrfToken);
        if (!csrfValid) {
          await logSecurityEvent('csrf_failure', {
            ip,
            userId,
            path: '/api/example-secure',
          });

          return NextResponse.json(
            { error: 'Invalid CSRF token' },
            { status: 403 }
          );
        }
      }

      // 3. Parse and validate request body
      const body = await request.json();

      // 4. Input validation with Zod
      const validation = safeValidate(
        userLoginSchema.omit({ password: true }),
        body
      );

      if (!validation.success) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: validation.errors,
          },
          { status: 400 }
        );
      }

      const validatedData = validation.data;

      // 5. Input sanitization
      const sanitizedEmail = sanitizeEmail(validatedData.email);
      if (!sanitizedEmail) {
        return NextResponse.json(
          { error: 'Invalid email format' },
          { status: 400 }
        );
      }

      // 6. Business logic
      // ... your actual business logic here ...
      const result = {
        message: 'Success',
        userId,
        email: sanitizedEmail,
        authMethod,
      };

      // 7. Sanitize response (remove sensitive data)
      const sanitizedResponse = sanitizeAPIResponse(result);

      // 8. Log successful request
      await logSecurityEvent('api_request', {
        ip,
        userId,
        path: '/api/example-secure',
        method: 'POST',
        success: true,
      });

      // 9. Return response
      return NextResponse.json(sanitizedResponse, { status: 200 });
    } catch (error) {
      // Error handling
      console.error('API error:', error);

      // Don't expose internal errors in production
      const message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : error instanceof Error
          ? error.message
          : 'Unknown error';

      return NextResponse.json(
        { error: message },
        { status: 500 }
      );
    }
  });
}

/**
 * GET /api/example-secure
 * Example of a secure GET endpoint with pagination
 */
export async function GET(request: NextRequest) {
  return withRateLimit(request, 'api', async () => {
    try {
      const ip = getClientIP(request);

      // Authentication required
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }

      // Parse query parameters
      const { searchParams } = request.nextUrl;
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '10', 10);

      // Validate pagination parameters
      if (page < 1 || page > 1000) {
        return NextResponse.json(
          { error: 'Invalid page number (1-1000)' },
          { status: 400 }
        );
      }

      if (limit < 1 || limit > 100) {
        return NextResponse.json(
          { error: 'Invalid limit (1-100)' },
          { status: 400 }
        );
      }

      // Business logic
      const results = {
        data: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };

      // Sanitize response
      const sanitizedResponse = sanitizeAPIResponse(results);

      return NextResponse.json(sanitizedResponse, { status: 200 });
    } catch (error) {
      console.error('API error:', error);

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  });
}

/**
 * OPTIONS /api/example-secure
 * CORS preflight handling is done in middleware
 */
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204 });
}
