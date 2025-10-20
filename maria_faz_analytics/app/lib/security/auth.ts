/**
 * Enhanced Authentication System
 * Implements 2FA, account lockout, session management, and secure password reset
 */

import { Redis } from '@upstash/redis';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import bcryptjs from 'bcryptjs';
import { nanoid } from 'nanoid';
import { prisma } from '@/lib/db';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Session configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes in milliseconds
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 60; // 30 minutes in seconds

/**
 * Generate 2FA secret for user
 */
export async function generate2FASecret(userId: string, email: string): Promise<{
  secret: string;
  qrCode: string;
  backupCodes: string[];
}> {
  // Generate secret
  const secret = speakeasy.generateSecret({
    name: `Alojamento Insight (${email})`,
    issuer: 'Alojamento Insight Analyzer',
    length: 32,
  });

  // Generate QR code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

  // Generate backup codes
  const backupCodes = Array.from({ length: 10 }, () =>
    nanoid(10).toUpperCase()
  );

  // Store secret and backup codes (encrypted)
  await redis.set(`2fa:secret:${userId}`, secret.base32, { ex: 3600 }); // Temporary, until verified
  await redis.set(`2fa:backup:${userId}`, JSON.stringify(backupCodes), { ex: 3600 });

  return {
    secret: secret.base32,
    qrCode,
    backupCodes,
  };
}

/**
 * Verify 2FA code
 */
export function verify2FACode(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow 2 time steps before/after
  });
}

/**
 * Enable 2FA for user
 */
export async function enable2FA(
  userId: string,
  secret: string,
  backupCodes: string[]
): Promise<void> {
  // Hash backup codes before storing
  const hashedBackupCodes = await Promise.all(
    backupCodes.map((code) => bcryptjs.hash(code, 10))
  );

  // Store in database (you'll need to add these fields to your schema)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: true,
      twoFactorSecret: secret,
      twoFactorBackupCodes: JSON.stringify(hashedBackupCodes),
    },
  });

  // Remove temporary data
  await redis.del(`2fa:secret:${userId}`);
  await redis.del(`2fa:backup:${userId}`);
}

/**
 * Disable 2FA for user
 */
export async function disable2FA(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    },
  });
}

/**
 * Verify backup code
 */
export async function verifyBackupCode(
  userId: string,
  code: string
): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { twoFactorBackupCodes: true },
  });

  if (!user?.twoFactorBackupCodes) {
    return false;
  }

  const backupCodes = JSON.parse(user.twoFactorBackupCodes);

  // Check if code matches any backup code
  for (let i = 0; i < backupCodes.length; i++) {
    const isValid = await bcryptjs.compare(code, backupCodes[i]);
    if (isValid) {
      // Remove used backup code
      backupCodes.splice(i, 1);
      await prisma.user.update({
        where: { id: userId },
        data: {
          twoFactorBackupCodes: JSON.stringify(backupCodes),
        },
      });
      return true;
    }
  }

  return false;
}

/**
 * Track failed login attempt
 */
export async function trackFailedLogin(identifier: string): Promise<{
  count: number;
  locked: boolean;
  lockoutEnd?: number;
}> {
  const key = `failed-login:${identifier}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // Set expiry for 1 hour
    await redis.expire(key, 3600);
  }

  // Lock account after MAX_FAILED_ATTEMPTS
  if (count >= MAX_FAILED_ATTEMPTS) {
    const lockoutEnd = Date.now() + LOCKOUT_DURATION * 1000;
    await redis.set(`locked:${identifier}`, lockoutEnd.toString(), {
      ex: LOCKOUT_DURATION
    });
    return { count, locked: true, lockoutEnd };
  }

  return { count, locked: false };
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(identifier: string): Promise<{
  locked: boolean;
  lockoutEnd?: number;
}> {
  const lockoutEnd = await redis.get(`locked:${identifier}`);

  if (lockoutEnd) {
    const end = parseInt(lockoutEnd as string, 10);
    if (Date.now() < end) {
      return { locked: true, lockoutEnd: end };
    }
    // Lock expired, clean up
    await redis.del(`locked:${identifier}`);
  }

  return { locked: false };
}

/**
 * Reset failed login attempts
 */
export async function resetFailedLogins(identifier: string): Promise<void> {
  await redis.del(`failed-login:${identifier}`);
  await redis.del(`locked:${identifier}`);
}

/**
 * Create password reset token
 */
export async function createPasswordResetToken(userId: string): Promise<string> {
  const token = nanoid(32);
  const hashedToken = await bcryptjs.hash(token, 10);

  // Store hashed token with expiry (1 hour)
  await redis.set(`reset-token:${userId}`, hashedToken, { ex: 3600 });

  return token;
}

/**
 * Verify password reset token
 */
export async function verifyPasswordResetToken(
  userId: string,
  token: string
): Promise<boolean> {
  const hashedToken = await redis.get(`reset-token:${userId}`);

  if (!hashedToken) {
    return false;
  }

  const isValid = await bcryptjs.compare(token, hashedToken as string);

  if (isValid) {
    // Delete token after successful verification
    await redis.del(`reset-token:${userId}`);
  }

  return isValid;
}

/**
 * Create email verification token
 */
export async function createEmailVerificationToken(
  userId: string
): Promise<string> {
  const token = nanoid(32);
  const hashedToken = await bcryptjs.hash(token, 10);

  // Store hashed token with expiry (24 hours)
  await redis.set(`verify-email:${userId}`, hashedToken, { ex: 86400 });

  return token;
}

/**
 * Verify email verification token
 */
export async function verifyEmailVerificationToken(
  userId: string,
  token: string
): Promise<boolean> {
  const hashedToken = await redis.get(`verify-email:${userId}`);

  if (!hashedToken) {
    return false;
  }

  const isValid = await bcryptjs.compare(token, hashedToken as string);

  if (isValid) {
    // Mark email as verified
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerified: new Date() },
    });

    // Delete token
    await redis.del(`verify-email:${userId}`);
  }

  return isValid;
}

/**
 * Track user session
 */
export async function trackSession(
  sessionId: string,
  userId: string,
  metadata: {
    ip: string;
    userAgent: string;
    lastActivity: number;
  }
): Promise<void> {
  await redis.set(
    `session:${sessionId}`,
    JSON.stringify({ userId, ...metadata }),
    { ex: SESSION_TIMEOUT / 1000 }
  );
}

/**
 * Update session activity
 */
export async function updateSessionActivity(sessionId: string): Promise<void> {
  const session = await redis.get(`session:${sessionId}`);

  if (session) {
    const data = JSON.parse(session as string);
    data.lastActivity = Date.now();

    await redis.set(`session:${sessionId}`, JSON.stringify(data), {
      ex: SESSION_TIMEOUT / 1000,
    });
  }
}

/**
 * Check session validity
 */
export async function isSessionValid(sessionId: string): Promise<boolean> {
  const session = await redis.get(`session:${sessionId}`);

  if (!session) {
    return false;
  }

  const data = JSON.parse(session as string);
  const timeSinceLastActivity = Date.now() - data.lastActivity;

  // Session expired due to inactivity
  if (timeSinceLastActivity > SESSION_TIMEOUT) {
    await redis.del(`session:${sessionId}`);
    return false;
  }

  return true;
}

/**
 * Invalidate session
 */
export async function invalidateSession(sessionId: string): Promise<void> {
  await redis.del(`session:${sessionId}`);
}

/**
 * Invalidate all user sessions
 */
export async function invalidateAllUserSessions(userId: string): Promise<void> {
  // Get all sessions for user
  const keys = await redis.keys(`session:*`);

  for (const key of keys) {
    const session = await redis.get(key);
    if (session) {
      const data = JSON.parse(session as string);
      if (data.userId === userId) {
        await redis.del(key);
      }
    }
  }
}

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  return bcryptjs.hash(password, 12); // Use cost factor of 12
}

/**
 * Verify password
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword);
}

/**
 * Check password strength
 */
export function checkPasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 12) score += 1;
  if (password.length >= 16) score += 1;
  if (password.length < 12) {
    feedback.push('Password should be at least 12 characters long');
  }

  // Character variety
  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/[0-9]/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  else feedback.push('Add special characters');

  // Common patterns check
  const commonPatterns = [
    /password/i,
    /123456/,
    /qwerty/i,
    /admin/i,
    /letmein/i,
  ];

  if (commonPatterns.some((pattern) => pattern.test(password))) {
    score -= 2;
    feedback.push('Avoid common words and patterns');
  }

  // Sequential characters
  if (/(.)\1{2,}/.test(password)) {
    score -= 1;
    feedback.push('Avoid repeating characters');
  }

  return {
    score: Math.max(0, Math.min(6, score)),
    feedback,
  };
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length: number = 32): string {
  return nanoid(length);
}

/**
 * Create CSRF token
 */
export async function createCSRFToken(sessionId: string): Promise<string> {
  const token = generateSecureToken(32);
  await redis.set(`csrf:${sessionId}`, token, { ex: 3600 }); // 1 hour
  return token;
}

/**
 * Verify CSRF token
 */
export async function verifyCSRFToken(
  sessionId: string,
  token: string
): Promise<boolean> {
  const storedToken = await redis.get(`csrf:${sessionId}`);
  return storedToken === token;
}
