/**
 * Input Sanitization and Validation
 * Prevents XSS, SQL Injection, and other injection attacks
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import validator from 'validator';

// Create DOMPurify instance for server-side
const window = new JSDOM('').window;
const purify = DOMPurify(window as any);

/**
 * Sanitize HTML content
 * Removes dangerous tags and attributes
 */
export function sanitizeHTML(dirty: string, allowedTags?: string[]): string {
  const config = allowedTags
    ? {
        ALLOWED_TAGS: allowedTags,
        ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
      }
    : {
        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
        ALLOWED_ATTR: ['href', 'title'],
      };

  return purify.sanitize(dirty, config);
}

/**
 * Sanitize string for SQL
 * Escapes dangerous characters
 */
export function sanitizeForSQL(input: string): string {
  // Remove or escape dangerous SQL characters
  return input
    .replace(/'/g, "''") // Escape single quotes
    .replace(/;/g, '') // Remove semicolons
    .replace(/--/g, '') // Remove SQL comments
    .replace(/\/\*/g, '') // Remove block comment start
    .replace(/\*\//g, ''); // Remove block comment end
}

/**
 * Validate and sanitize email
 */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();

  if (!validator.isEmail(trimmed)) {
    return null;
  }

  // Check for disposable email domains
  if (isDisposableEmail(trimmed)) {
    return null;
  }

  return validator.normalizeEmail(trimmed) || trimmed;
}

/**
 * Check if email is from a disposable domain
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'temp-mail.org',
    'fakeinbox.com',
    'trashmail.com',
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.includes(domain);
}

/**
 * Validate and sanitize URL
 * Prevents SSRF attacks
 */
export function sanitizeURL(url: string): string | null {
  const trimmed = url.trim();

  // Validate URL format
  if (!validator.isURL(trimmed, { protocols: ['http', 'https'] })) {
    return null;
  }

  try {
    const parsed = new URL(trimmed);

    // Prevent internal network access
    const hostname = parsed.hostname.toLowerCase();

    // Block localhost and private IPs
    const blockedHosts = [
      'localhost',
      '127.0.0.1',
      '0.0.0.0',
      '::1',
      '[::1]',
    ];

    if (blockedHosts.includes(hostname)) {
      return null;
    }

    // Block private IP ranges
    if (
      hostname.startsWith('10.') ||
      hostname.startsWith('192.168.') ||
      hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
    ) {
      return null;
    }

    return trimmed;
  } catch {
    return null;
  }
}

/**
 * Sanitize filename
 * Prevents directory traversal
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/\.\./g, '') // Remove parent directory references
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace special characters
    .substring(0, 255); // Limit length
}

/**
 * Sanitize input for JSON
 * Prevents JSON injection
 */
export function sanitizeJSON(input: any): any {
  if (typeof input === 'string') {
    // Remove control characters
    return input.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeJSON);
  }

  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeJSON(key)] = sanitizeJSON(value);
    }
    return sanitized;
  }

  return input;
}

/**
 * Validate phone number
 */
export function sanitizePhoneNumber(phone: string): string | null {
  const cleaned = phone.replace(/\D/g, '');

  if (cleaned.length < 10 || cleaned.length > 15) {
    return null;
  }

  return cleaned;
}

/**
 * Sanitize user input (general purpose)
 */
export function sanitizeUserInput(input: string, maxLength: number = 1000): string {
  return input
    .trim()
    .substring(0, maxLength)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validate and sanitize integer
 */
export function sanitizeInteger(input: any, min?: number, max?: number): number | null {
  const num = parseInt(input, 10);

  if (isNaN(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Validate and sanitize float
 */
export function sanitizeFloat(input: any, min?: number, max?: number): number | null {
  const num = parseFloat(input);

  if (isNaN(num) || !isFinite(num)) {
    return null;
  }

  if (min !== undefined && num < min) {
    return null;
  }

  if (max !== undefined && num > max) {
    return null;
  }

  return num;
}

/**
 * Sanitize boolean
 */
export function sanitizeBoolean(input: any): boolean {
  if (typeof input === 'boolean') {
    return input;
  }

  if (typeof input === 'string') {
    return input.toLowerCase() === 'true' || input === '1';
  }

  return !!input;
}

/**
 * Detect and prevent NoSQL injection
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  const sanitized: any = {};

  for (const [key, value] of Object.entries(query)) {
    // Prevent operator injection
    if (key.startsWith('$')) {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      // Check for nested operators
      const hasOperator = Object.keys(value).some((k) => k.startsWith('$'));
      if (hasOperator) {
        continue;
      }

      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize command line input
 * Prevents command injection
 */
export function sanitizeCommandInput(input: string): string | null {
  // Only allow alphanumeric, dash, underscore, and dot
  if (!/^[a-zA-Z0-9._-]+$/.test(input)) {
    return null;
  }

  return input;
}

/**
 * Rate limit key sanitization
 */
export function sanitizeRateLimitKey(input: string): string {
  return input
    .replace(/[^a-zA-Z0-9:_-]/g, '')
    .substring(0, 100);
}
