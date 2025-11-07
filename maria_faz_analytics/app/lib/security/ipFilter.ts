/**
 * IP Filtering and Reputation System
 * Blacklist/whitelist IP addresses
 * Check IP reputation
 */

import { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// IP Whitelist from environment
const IP_WHITELIST = (process.env.IP_WHITELIST || '').split(',').filter(Boolean);

// IP Blacklist from environment
const IP_BLACKLIST = (process.env.IP_BLACKLIST || '').split(',').filter(Boolean);

/**
 * Get client IP address from request
 */
export function getClientIP(request: NextRequest): string {
  // Check various headers for IP address
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIP = request.headers.get('x-real-ip');
  if (realIP) {
    return realIP.trim();
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip');
  if (cfConnectingIP) {
    return cfConnectingIP.trim();
  }

  return 'unknown';
}

/**
 * Check if IP is in whitelist
 */
export function isWhitelisted(ip: string): boolean {
  return IP_WHITELIST.includes(ip);
}

/**
 * Check if IP is in static blacklist
 */
export function isStaticBlacklisted(ip: string): boolean {
  return IP_BLACKLIST.includes(ip);
}

/**
 * Check if IP is in dynamic blacklist (Redis)
 */
export async function isDynamicBlacklisted(ip: string): Promise<boolean> {
  const blocked = await redis.get(`blacklist:${ip}`);
  return blocked === '1';
}

/**
 * Add IP to dynamic blacklist
 */
export async function addToBlacklist(
  ip: string,
  reason: string,
  duration?: number
): Promise<void> {
  await redis.set(`blacklist:${ip}`, '1', duration ? { ex: duration } : undefined);
  await redis.set(`blacklist:reason:${ip}`, reason, duration ? { ex: duration } : undefined);

  // Log the blacklist event
  await logSecurityEvent('ip_blacklisted', {
    ip,
    reason,
    duration,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Remove IP from dynamic blacklist
 */
export async function removeFromBlacklist(ip: string): Promise<void> {
  await redis.del(`blacklist:${ip}`);
  await redis.del(`blacklist:reason:${ip}`);
}

/**
 * Get blacklist reason
 */
export async function getBlacklistReason(ip: string): Promise<string | null> {
  const reason = await redis.get(`blacklist:reason:${ip}`);
  return reason as string | null;
}

/**
 * Check if IP is allowed (passes whitelist and blacklist checks)
 */
export async function isIPAllowed(ip: string): Promise<boolean> {
  // Whitelist takes precedence
  if (isWhitelisted(ip)) {
    return true;
  }

  // Check static blacklist
  if (isStaticBlacklisted(ip)) {
    return false;
  }

  // Check dynamic blacklist
  if (await isDynamicBlacklisted(ip)) {
    return false;
  }

  return true;
}

/**
 * Track suspicious activity from IP
 */
export async function trackSuspiciousActivity(
  ip: string,
  activity: string
): Promise<void> {
  const key = `suspicious:${ip}`;
  const count = await redis.incr(key);

  if (count === 1) {
    // Set expiry for 1 hour
    await redis.expire(key, 3600);
  }

  // Auto-blacklist after 10 suspicious activities
  if (count >= 10) {
    await addToBlacklist(ip, `Auto-blacklisted: ${activity}`, 86400); // 24 hours
  }

  // Log suspicious activity
  await logSecurityEvent('suspicious_activity', {
    ip,
    activity,
    count,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Get suspicious activity count
 */
export async function getSuspiciousActivityCount(ip: string): Promise<number> {
  const count = await redis.get(`suspicious:${ip}`);
  return count ? parseInt(count as string, 10) : 0;
}

/**
 * Check IP reputation using external services
 * (This is a placeholder - integrate with actual reputation services)
 */
export async function checkIPReputation(ip: string): Promise<{
  score: number;
  threat: boolean;
  details: string[];
}> {
  // Check local cache first
  const cached = await redis.get(`reputation:${ip}`);
  if (cached) {
    return JSON.parse(cached as string);
  }

  // In a real implementation, you would call external services like:
  // - AbuseIPDB
  // - IPQualityScore
  // - VirusTotal
  // - Shodan
  // For now, return a default safe response

  const result = {
    score: 100, // 0-100, higher is better
    threat: false,
    details: [],
  };

  // Cache for 24 hours
  await redis.set(`reputation:${ip}`, JSON.stringify(result), { ex: 86400 });

  return result;
}

/**
 * Analyze request for suspicious patterns
 */
export function analyzeRequest(request: NextRequest): {
  suspicious: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];

  // Check user agent
  const userAgent = request.headers.get('user-agent') || '';
  if (!userAgent) {
    reasons.push('Missing User-Agent');
  } else if (isSuspiciousUserAgent(userAgent)) {
    reasons.push('Suspicious User-Agent');
  }

  // Check for common attack patterns in URL
  const url = request.url.toLowerCase();
  const attackPatterns = [
    'script',
    'alert',
    'onerror',
    'onclick',
    '../',
    '..\\',
    'union select',
    'drop table',
    'insert into',
    'base64',
    'eval(',
  ];

  for (const pattern of attackPatterns) {
    if (url.includes(pattern)) {
      reasons.push(`Attack pattern detected: ${pattern}`);
    }
  }

  // Check referer
  const referer = request.headers.get('referer');
  if (referer && isSuspiciousReferer(referer)) {
    reasons.push('Suspicious Referer');
  }

  return {
    suspicious: reasons.length > 0,
    reasons,
  };
}

/**
 * Check if user agent is suspicious
 */
function isSuspiciousUserAgent(userAgent: string): boolean {
  const suspiciousPatterns = [
    'bot',
    'crawler',
    'spider',
    'scraper',
    'python',
    'curl',
    'wget',
    'scanner',
  ];

  const lowerUA = userAgent.toLowerCase();

  // Allow legitimate bots
  const allowedBots = ['googlebot', 'bingbot', 'slackbot', 'facebookexternalhit'];
  if (allowedBots.some((bot) => lowerUA.includes(bot))) {
    return false;
  }

  return suspiciousPatterns.some((pattern) => lowerUA.includes(pattern));
}

/**
 * Check if referer is suspicious
 */
function isSuspiciousReferer(referer: string): boolean {
  // Add known malicious or spam domains
  const suspiciousDomains = [
    'viagra',
    'casino',
    'porn',
    'adult',
    'xxx',
  ];

  const lowerReferer = referer.toLowerCase();
  return suspiciousDomains.some((domain) => lowerReferer.includes(domain));
}

/**
 * Log security events
 */
export async function logSecurityEvent(
  event: string,
  data: Record<string, any>
): Promise<void> {
  const key = `security:event:${Date.now()}`;
  await redis.set(key, JSON.stringify({ event, ...data }), { ex: 2592000 }); // 30 days

  // Also add to a sorted set for easy querying
  await redis.zadd('security:events', {
    score: Date.now(),
    member: key,
  });

  // Keep only last 10000 events
  await redis.zremrangebyrank('security:events', 0, -10001);

  // Check if we should send an alert
  if (shouldAlertOnEvent(event)) {
    await sendSecurityAlert(event, data);
  }
}

/**
 * Check if event should trigger an alert
 */
function shouldAlertOnEvent(event: string): boolean {
  const alertEvents = [
    'ip_blacklisted',
    'account_locked',
    'multiple_failed_logins',
    'sql_injection_attempt',
    'xss_attempt',
  ];

  return alertEvents.includes(event);
}

/**
 * Send security alert
 */
async function sendSecurityAlert(
  event: string,
  data: Record<string, any>
): Promise<void> {
  // In a real implementation, send to Slack, email, or monitoring service
  console.error('[SECURITY ALERT]', event, data);

  // Store alert for dashboard
  await redis.lpush('security:alerts', JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
  await redis.ltrim('security:alerts', 0, 99); // Keep last 100 alerts
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(limit: number = 100): Promise<any[]> {
  const keys = await redis.zrange('security:events', -limit, -1);
  const events = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.get(key);
      return data ? JSON.parse(data as string) : null;
    })
  );

  return events.filter(Boolean);
}

/**
 * Get security alerts
 */
export async function getSecurityAlerts(): Promise<any[]> {
  const alerts = await redis.lrange('security:alerts', 0, -1);
  return alerts.map((alert) => JSON.parse(alert));
}
