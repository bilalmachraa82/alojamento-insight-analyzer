/**
 * Security Headers Configuration
 * Implements OWASP recommended security headers
 */

import { NextResponse } from 'next/server';

/**
 * Content Security Policy
 * Prevents XSS, clickjacking, and other code injection attacks
 */
// Environment-aware CSP configuration
const isDevelopment = process.env.NODE_ENV === 'development';

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': isDevelopment
    ? [
        "'self'",
        "'unsafe-inline'", // Required for Next.js HMR in development
        "'unsafe-eval'", // Required for development hot reload
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ]
    : [
        "'self'",
        // In production, use nonce-based inline scripts instead of unsafe-inline
        // Remove unsafe-eval entirely in production for better security
        'https://cdn.jsdelivr.net',
        'https://unpkg.com',
      ],
  'style-src': isDevelopment
    ? ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com']
    : ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'], // unsafe-inline often required for CSS-in-JS
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:'],
  'connect-src': [
    "'self'",
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_API_URL || '',
    'https://*.supabase.co',
  ].filter(Boolean),
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'object-src': ["'none'"],
  'upgrade-insecure-requests': [],
  // Additional security directives for production
  ...(isDevelopment ? {} : {
    'require-trusted-types-for': ["'script'"],
  }),
};

/**
 * Generate CSP header value
 */
export function generateCSP(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([key, values]) => {
      if (values.length === 0) {
        return key;
      }
      return `${key} ${values.join(' ')}`;
    })
    .join('; ');
}

/**
 * Permissions Policy (formerly Feature Policy)
 * Controls which browser features can be used
 */
export const PERMISSIONS_POLICY = {
  camera: [],
  microphone: [],
  geolocation: ["'self'"],
  'payment': [],
  'usb': [],
  'accelerometer': [],
  'gyroscope': [],
  'magnetometer': [],
  'picture-in-picture': [],
  'display-capture': [],
};

/**
 * Generate Permissions Policy header value
 */
export function generatePermissionsPolicy(): string {
  return Object.entries(PERMISSIONS_POLICY)
    .map(([key, values]) => {
      if (values.length === 0) {
        return `${key}=()`;
      }
      return `${key}=(${values.join(' ')})`;
    })
    .join(', ');
}

/**
 * Security headers to add to all responses
 */
export const SECURITY_HEADERS = {
  // Content Security Policy
  'Content-Security-Policy': generateCSP(),

  // Strict Transport Security (HSTS)
  // Force HTTPS for 2 years, including subdomains
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // Prevent MIME sniffing
  'X-Content-Type-Options': 'nosniff',

  // XSS Protection (legacy, but still useful)
  'X-XSS-Protection': '1; mode=block',

  // Referrer Policy
  'Referrer-Policy': 'no-referrer',

  // Permissions Policy
  'Permissions-Policy': generatePermissionsPolicy(),

  // Remove server information
  'X-Powered-By': '', // This will remove the header

  // DNS Prefetch Control
  'X-DNS-Prefetch-Control': 'off',

  // Download Options (IE)
  'X-Download-Options': 'noopen',

  // Permitted Cross-Domain Policies
  'X-Permitted-Cross-Domain-Policies': 'none',
};

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: NextResponse): NextResponse {
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    if (value === '') {
      // Remove header
      response.headers.delete(key);
    } else {
      response.headers.set(key, value);
    }
  });

  return response;
}

/**
 * CORS configuration
 */
export const CORS_CONFIG = {
  allowedOrigins: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean),
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-CSRF-Token',
    'X-API-Key',
  ],
  exposedHeaders: [
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],
  credentials: true,
  maxAge: 86400, // 24 hours
};

/**
 * Apply CORS headers to response
 */
export function applyCORSHeaders(
  response: NextResponse,
  origin: string | null
): NextResponse {
  // Check if origin is allowed
  const isAllowed =
    origin &&
    (CORS_CONFIG.allowedOrigins.includes('*') ||
      CORS_CONFIG.allowedOrigins.includes(origin));

  if (isAllowed) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      CORS_CONFIG.allowedMethods.join(', ')
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      CORS_CONFIG.allowedHeaders.join(', ')
    );
    response.headers.set(
      'Access-Control-Expose-Headers',
      CORS_CONFIG.exposedHeaders.join(', ')
    );
    response.headers.set(
      'Access-Control-Max-Age',
      CORS_CONFIG.maxAge.toString()
    );
  }

  return response;
}

/**
 * Handle preflight OPTIONS request
 */
export function handlePreflight(origin: string | null): NextResponse {
  const response = new NextResponse(null, { status: 204 });
  return applyCORSHeaders(response, origin);
}
