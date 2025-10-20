/**
 * Enhanced Validation Schemas with Zod
 * Strict input validation for all user inputs
 */

import { z } from 'zod';

/**
 * Password validation schema
 * Requirements:
 * - At least 12 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 */
export const passwordSchema = z
  .string()
  .min(12, 'Password must be at least 12 characters')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(
    /[^A-Za-z0-9]/,
    'Password must contain at least one special character'
  );

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .email('Invalid email address')
  .min(5, 'Email must be at least 5 characters')
  .max(254, 'Email must not exceed 254 characters')
  .toLowerCase()
  .transform((val) => val.trim());

/**
 * URL validation schema
 */
export const urlSchema = z
  .string()
  .url('Invalid URL')
  .regex(/^https?:\/\//, 'URL must start with http:// or https://')
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        const hostname = parsed.hostname.toLowerCase();

        // Block localhost and private IPs
        const blocked = [
          'localhost',
          '127.0.0.1',
          '0.0.0.0',
          '::1',
        ];

        if (blocked.includes(hostname)) {
          return false;
        }

        // Block private IP ranges
        if (
          hostname.startsWith('10.') ||
          hostname.startsWith('192.168.') ||
          hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
        ) {
          return false;
        }

        return true;
      } catch {
        return false;
      }
    },
    { message: 'Invalid or blocked URL' }
  );

/**
 * UUID validation schema
 */
export const uuidSchema = z
  .string()
  .uuid('Invalid UUID format');

/**
 * User registration schema
 */
export const userRegistrationSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'First name contains invalid characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s-']+$/, 'Last name contains invalid characters'),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
});

/**
 * User login schema
 */
export const userLoginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
  totpCode: z.string().length(6).regex(/^\d+$/).optional(),
});

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: emailSchema,
});

/**
 * Password reset schema
 */
export const passwordResetSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * Change password schema
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

/**
 * Property creation schema
 */
export const propertySchema = z.object({
  name: z
    .string()
    .min(1, 'Property name is required')
    .max(200, 'Property name must not exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s-_.,&()]+$/, 'Property name contains invalid characters'),
  address: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .optional(),
  city: z
    .string()
    .max(100, 'City must not exceed 100 characters')
    .optional(),
  country: z
    .string()
    .length(2, 'Country code must be 2 characters')
    .regex(/^[A-Z]{2}$/, 'Invalid country code')
    .optional(),
  propertyType: z
    .enum(['hotel', 'apartment', 'hostel', 'villa', 'other'])
    .optional(),
  url: urlSchema.optional(),
});

/**
 * API key creation schema
 */
export const apiKeySchema = z.object({
  name: z
    .string()
    .min(1, 'API key name is required')
    .max(100, 'API key name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s-_]+$/, 'API key name contains invalid characters'),
  permissions: z.array(z.enum(['read', 'write', 'delete'])).min(1),
  expiresAt: z.date().optional(),
});

/**
 * Diagnostic submission schema
 */
export const diagnosticSchema = z.object({
  propertyUrl: urlSchema,
  email: emailSchema,
  propertyName: z
    .string()
    .min(1, 'Property name is required')
    .max(200, 'Property name must not exceed 200 characters'),
  additionalNotes: z
    .string()
    .max(1000, 'Additional notes must not exceed 1000 characters')
    .optional(),
});

/**
 * Search query schema
 */
export const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query must not exceed 200 characters')
    .regex(/^[a-zA-Z0-9\s-_.,&()]+$/, 'Search query contains invalid characters'),
  filters: z.record(z.string(), z.any()).optional(),
  page: z.number().int().min(1).max(1000).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.string().max(50).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * Date range schema
 */
export const dateRangeSchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after start date',
  path: ['endDate'],
}).refine((data) => {
  const daysDiff = Math.ceil((data.endDate.getTime() - data.startDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysDiff <= 365;
}, {
  message: 'Date range must not exceed 365 days',
  path: ['endDate'],
});

/**
 * File upload schema
 */
export const fileUploadSchema = z.object({
  filename: z
    .string()
    .min(1, 'Filename is required')
    .max(255, 'Filename must not exceed 255 characters')
    .regex(/^[a-zA-Z0-9._-]+$/, 'Filename contains invalid characters'),
  mimeType: z
    .string()
    .regex(/^[a-zA-Z0-9]+\/[a-zA-Z0-9\-+.]+$/, 'Invalid MIME type'),
  size: z
    .number()
    .int()
    .min(1, 'File size must be greater than 0')
    .max(10 * 1024 * 1024, 'File size must not exceed 10MB'),
});

/**
 * Phone number schema (international format)
 */
export const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
  .optional();

/**
 * Credit card validation (for tokenized data only)
 */
export const creditCardTokenSchema = z
  .string()
  .regex(/^tok_[a-zA-Z0-9]{24}$/, 'Invalid credit card token');

/**
 * 2FA setup schema
 */
export const twoFactorSetupSchema = z.object({
  secret: z.string().min(1, 'Secret is required'),
  totpCode: z
    .string()
    .length(6, 'TOTP code must be 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits'),
});

/**
 * 2FA verification schema
 */
export const twoFactorVerifySchema = z.object({
  totpCode: z
    .string()
    .length(6, 'TOTP code must be 6 digits')
    .regex(/^\d+$/, 'TOTP code must contain only digits'),
});

/**
 * Webhook schema
 */
export const webhookSchema = z.object({
  url: urlSchema,
  events: z.array(z.string()).min(1, 'At least one event is required'),
  secret: z.string().min(32, 'Secret must be at least 32 characters'),
});

/**
 * Report generation schema
 */
export const reportGenerationSchema = z.object({
  propertyId: uuidSchema,
  reportType: z.enum(['standard', 'premium', 'competitor']),
  dateRange: dateRangeSchema,
  format: z.enum(['pdf', 'excel', 'json']).optional(),
});

/**
 * Sanitize and validate input
 */
export function validateInput<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
}

/**
 * Safe parse with error formatting
 */
export function safeValidate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);

  if (result.success) {
    return { success: true, data: result.data };
  }

  const errors: Record<string, string> = {};
  result.error.errors.forEach((err) => {
    const path = err.path.join('.');
    errors[path] = err.message;
  });

  return { success: false, errors };
}
