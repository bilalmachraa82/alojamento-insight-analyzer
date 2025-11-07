/**
 * API Security
 * Handles API key management, request signing, and API authentication
 */

import crypto from 'crypto';
import { nanoid } from 'nanoid';
import bcryptjs from 'bcryptjs';
import { Redis } from '@upstash/redis';
import { prisma } from '@/lib/db';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

const API_SECRET = process.env.API_SECRET || 'change-me-in-production';

/**
 * Generate API key
 */
export async function generateAPIKey(
  userId: string,
  name: string,
  permissions: string[] = ['read']
): Promise<{
  id: string;
  key: string;
  displayKey: string;
}> {
  // Generate a secure API key
  const key = `sk_${nanoid(32)}`;
  const keyHash = await bcryptjs.hash(key, 10);

  // Store in database (you'll need to add this table to your Prisma schema)
  const apiKey = await prisma.apiKey.create({
    data: {
      userId,
      keyHash,
      name,
      permissions: JSON.stringify(permissions),
    },
  });

  // Cache the key hash for fast lookups
  await redis.set(`api-key:${keyHash}`, userId, { ex: 86400 });

  return {
    id: apiKey.id,
    key, // Only returned once
    displayKey: `${key.substring(0, 12)}...${key.substring(key.length - 4)}`,
  };
}

/**
 * Verify API key
 */
export async function verifyAPIKey(key: string): Promise<{
  valid: boolean;
  userId?: string;
  permissions?: string[];
}> {
  if (!key.startsWith('sk_')) {
    return { valid: false };
  }

  // Check cache first
  const keyHash = await bcryptjs.hash(key, 10);
  const cached = await redis.get(`api-key:${keyHash}`);

  if (cached) {
    const apiKey = await prisma.apiKey.findFirst({
      where: { keyHash },
    });

    if (apiKey && !apiKey.revoked) {
      // Update last used
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      return {
        valid: true,
        userId: apiKey.userId,
        permissions: JSON.parse(apiKey.permissions),
      };
    }
  }

  // Check database
  const apiKeys = await prisma.apiKey.findMany({
    where: { revoked: false },
  });

  for (const apiKey of apiKeys) {
    const isValid = await bcryptjs.compare(key, apiKey.keyHash);

    if (isValid) {
      // Check expiration
      if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
        return { valid: false };
      }

      // Update last used
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });

      // Cache for future requests
      await redis.set(`api-key:${apiKey.keyHash}`, apiKey.userId, {
        ex: 86400,
      });

      return {
        valid: true,
        userId: apiKey.userId,
        permissions: JSON.parse(apiKey.permissions),
      };
    }
  }

  return { valid: false };
}

/**
 * Revoke API key
 */
export async function revokeAPIKey(keyId: string, userId: string): Promise<boolean> {
  const result = await prisma.apiKey.updateMany({
    where: { id: keyId, userId },
    data: { revoked: true },
  });

  return result.count > 0;
}

/**
 * Rotate API key
 */
export async function rotateAPIKey(
  oldKeyId: string,
  userId: string
): Promise<{ key: string } | null> {
  const oldKey = await prisma.apiKey.findFirst({
    where: { id: oldKeyId, userId },
  });

  if (!oldKey) {
    return null;
  }

  // Create new key with same permissions
  const newKey = await generateAPIKey(
    userId,
    `${oldKey.name} (Rotated)`,
    JSON.parse(oldKey.permissions)
  );

  // Revoke old key
  await revokeAPIKey(oldKeyId, userId);

  return { key: newKey.key };
}

/**
 * Sign request payload
 */
export function signRequest(
  payload: Record<string, any>,
  secret: string = API_SECRET
): string {
  const timestamp = Date.now();
  const data = JSON.stringify({ ...payload, timestamp });

  const signature = crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  return `${signature}.${timestamp}`;
}

/**
 * Verify request signature
 */
export function verifyRequestSignature(
  payload: Record<string, any>,
  signature: string,
  secret: string = API_SECRET,
  maxAge: number = 300000 // 5 minutes
): boolean {
  try {
    const [sig, timestampStr] = signature.split('.');
    const timestamp = parseInt(timestampStr, 10);

    // Check timestamp validity
    if (Date.now() - timestamp > maxAge) {
      return false;
    }

    const data = JSON.stringify({ ...payload, timestamp });

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(sig),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Generate webhook signature
 */
export function generateWebhookSignature(
  payload: Record<string, any>,
  secret: string
): string {
  const data = JSON.stringify(payload);

  return crypto
    .createHmac('sha256', secret)
    .update(data)
    .digest('hex');
}

/**
 * Verify webhook signature
 */
export function verifyWebhookSignature(
  payload: Record<string, any>,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateWebhookSignature(payload, secret);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * Generate nonce for request replay protection
 */
export async function generateNonce(): Promise<string> {
  const nonce = nanoid(32);
  await redis.set(`nonce:${nonce}`, '1', { ex: 300 }); // Valid for 5 minutes
  return nonce;
}

/**
 * Verify and consume nonce
 */
export async function verifyAndConsumeNonce(nonce: string): Promise<boolean> {
  const exists = await redis.get(`nonce:${nonce}`);

  if (!exists) {
    return false;
  }

  // Delete nonce to prevent reuse
  await redis.del(`nonce:${nonce}`);
  return true;
}

/**
 * Encrypt sensitive data
 */
export function encryptData(data: string, key: string = API_SECRET): string {
  const algorithm = 'aes-256-gcm';
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(algorithm, Buffer.from(key, 'hex').slice(0, 32), iv);

  let encrypted = cipher.update(data, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt sensitive data
 */
export function decryptData(encryptedData: string, key: string = API_SECRET): string | null {
  try {
    const algorithm = 'aes-256-gcm';
    const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      algorithm,
      Buffer.from(key, 'hex').slice(0, 32),
      iv
    );

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Hash data with SHA-256
 */
export function hashData(data: string): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate secure random string
 */
export function generateSecureRandom(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Check API key permissions
 */
export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes('admin');
}

/**
 * Sanitize API response
 * Remove sensitive fields from response
 */
export function sanitizeAPIResponse(data: any, sensitiveFields: string[] = []): any {
  const defaultSensitiveFields = [
    'password',
    'passwordHash',
    'apiKey',
    'secret',
    'token',
    'privateKey',
    'twoFactorSecret',
    'twoFactorBackupCodes',
  ];

  const fieldsToRemove = [...defaultSensitiveFields, ...sensitiveFields];

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeAPIResponse(item, sensitiveFields));
  }

  if (typeof data === 'object' && data !== null) {
    const sanitized: any = {};

    for (const [key, value] of Object.entries(data)) {
      if (!fieldsToRemove.includes(key)) {
        sanitized[key] = sanitizeAPIResponse(value, sensitiveFields);
      }
    }

    return sanitized;
  }

  return data;
}

/**
 * Create API error response
 */
export function createAPIError(
  message: string,
  code: string,
  statusCode: number = 400,
  details?: any
): {
  error: {
    message: string;
    code: string;
    details?: any;
  };
  statusCode: number;
} {
  // Sanitize error message in production
  const sanitizedMessage =
    process.env.NODE_ENV === 'production'
      ? message.replace(/\/[a-zA-Z0-9_\-\/]+/g, '[PATH]') // Remove file paths
      : message;

  return {
    error: {
      message: sanitizedMessage,
      code,
      ...(details && { details }),
    },
    statusCode,
  };
}

/**
 * Log API request for audit
 */
export async function logAPIRequest(data: {
  userId?: string;
  apiKeyId?: string;
  endpoint: string;
  method: string;
  ip: string;
  userAgent: string;
  statusCode: number;
  responseTime: number;
}): Promise<void> {
  await redis.lpush('api-requests', JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
  }));

  // Keep only last 10000 requests
  await redis.ltrim('api-requests', 0, 9999);
}

/**
 * Get API usage statistics
 */
export async function getAPIUsageStats(userId: string, days: number = 30): Promise<{
  totalRequests: number;
  requestsByEndpoint: Record<string, number>;
  requestsByDay: Record<string, number>;
}> {
  const requests = await redis.lrange('api-requests', 0, -1);
  const parsedRequests = requests
    .map((req) => JSON.parse(req))
    .filter((req) => req.userId === userId);

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  const recentRequests = parsedRequests.filter(
    (req) => new Date(req.timestamp) >= cutoffDate
  );

  const requestsByEndpoint: Record<string, number> = {};
  const requestsByDay: Record<string, number> = {};

  for (const req of recentRequests) {
    // Count by endpoint
    requestsByEndpoint[req.endpoint] = (requestsByEndpoint[req.endpoint] || 0) + 1;

    // Count by day
    const day = new Date(req.timestamp).toISOString().split('T')[0];
    requestsByDay[day] = (requestsByDay[day] || 0) + 1;
  }

  return {
    totalRequests: recentRequests.length,
    requestsByEndpoint,
    requestsByDay,
  };
}
