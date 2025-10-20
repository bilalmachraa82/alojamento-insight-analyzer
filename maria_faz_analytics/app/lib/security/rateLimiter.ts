/**
 * Rate Limiting System
 * Uses Upstash Redis for distributed rate limiting
 * Implements sliding window algorithm for accurate rate limiting
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Rate limiters for different endpoints
export const rateLimiters = {
  // Diagnostic submissions: 5 per hour per IP
  diagnostic: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 h'),
    analytics: true,
    prefix: 'ratelimit:diagnostic',
  }),

  // API endpoints: 100 requests per minute per user
  api: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(100, '1 m'),
    analytics: true,
    prefix: 'ratelimit:api',
  }),

  // PDF downloads: 10 per hour per user
  pdfDownload: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    analytics: true,
    prefix: 'ratelimit:pdf',
  }),

  // Authentication: 5 attempts per 15 minutes per IP
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    analytics: true,
    prefix: 'ratelimit:auth',
  }),

  // Signup: 3 per hour per IP
  signup: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:signup',
  }),

  // Password reset: 3 per hour per IP
  passwordReset: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(3, '1 h'),
    analytics: true,
    prefix: 'ratelimit:password-reset',
  }),
};

// Admin whitelist
const ADMIN_WHITELIST = (process.env.ADMIN_WHITELIST || '').split(',').filter(Boolean);

/**
 * Get client identifier (IP or user ID)
 */
export function getClientIdentifier(request: NextRequest, session?: any): string {
  // Use user ID if authenticated, otherwise use IP
  if (session?.user?.id) {
    return `user:${session.user.id}`;
  }

  // Get IP address from headers
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

  return `ip:${ip}`;
}

/**
 * Check if identifier is whitelisted
 */
export function isWhitelisted(identifier: string): boolean {
  if (identifier.startsWith('user:')) {
    const userId = identifier.replace('user:', '');
    return ADMIN_WHITELIST.includes(userId);
  }

  if (identifier.startsWith('ip:')) {
    const ip = identifier.replace('ip:', '');
    return ADMIN_WHITELIST.includes(ip);
  }

  return false;
}

/**
 * Apply rate limiting to a request
 */
export async function rateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters,
  customIdentifier?: string
): Promise<{ success: boolean; limit: number; remaining: number; reset: number }> {
  const limiter = rateLimiters[limiterType];

  // Get identifier
  const session = await getServerSession(authOptions);
  const identifier = customIdentifier || getClientIdentifier(request, session);

  // Check whitelist
  if (isWhitelisted(identifier)) {
    return {
      success: true,
      limit: Infinity,
      remaining: Infinity,
      reset: 0,
    };
  }

  // Apply rate limit
  const result = await limiter.limit(identifier);

  return {
    success: result.success,
    limit: result.limit,
    remaining: result.remaining,
    reset: result.reset,
  };
}

/**
 * Create rate limit response
 */
export function createRateLimitResponse(
  result: { success: boolean; limit: number; remaining: number; reset: number },
  message?: string
): NextResponse {
  const response = NextResponse.json(
    {
      error: message || 'Too many requests. Please try again later.',
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset).toISOString(),
    },
    { status: 429 }
  );

  // Add rate limit headers
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());
  response.headers.set('Retry-After', Math.ceil((result.reset - Date.now()) / 1000).toString());

  return response;
}

/**
 * Middleware helper for rate limiting
 */
export async function withRateLimit(
  request: NextRequest,
  limiterType: keyof typeof rateLimiters,
  handler: () => Promise<NextResponse>
): Promise<NextResponse> {
  const result = await rateLimit(request, limiterType);

  if (!result.success) {
    return createRateLimitResponse(result);
  }

  const response = await handler();

  // Add rate limit headers to successful responses
  response.headers.set('X-RateLimit-Limit', result.limit.toString());
  response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  response.headers.set('X-RateLimit-Reset', result.reset.toString());

  return response;
}

/**
 * Track failed login attempts
 */
export async function trackFailedLogin(identifier: string): Promise<void> {
  const key = `failed-login:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // Set expiry for 1 hour
    await redis.expire(key, 3600);
  }

  // Lock account after 5 failed attempts
  if (count >= 5) {
    await redis.set(`locked:${identifier}`, '1', { ex: 1800 }); // Lock for 30 minutes
  }
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(identifier: string): Promise<boolean> {
  const locked = await redis.get(`locked:${identifier}`);
  return locked === '1';
}

/**
 * Reset failed login attempts
 */
export async function resetFailedLogins(identifier: string): Promise<void> {
  await redis.del(`failed-login:${identifier}`);
  await redis.del(`locked:${identifier}`);
}

/**
 * Get failed login count
 */
export async function getFailedLoginCount(identifier: string): Promise<number> {
  const count = await redis.get(`failed-login:${identifier}`);
  return count ? parseInt(count as string, 10) : 0;
}
