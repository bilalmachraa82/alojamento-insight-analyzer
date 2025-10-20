/**
 * Security Monitoring and Alerting System
 * Detects and alerts on security threats and anomalies
 */

import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Alert configuration
const SLACK_WEBHOOK_URL = process.env.SLACK_SECURITY_WEBHOOK_URL;
const ALERT_EMAIL = process.env.SECURITY_ALERT_EMAIL;

/**
 * Alert severity levels
 */
export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Security event types
 */
export enum SecurityEventType {
  FAILED_LOGIN = 'failed_login',
  ACCOUNT_LOCKED = 'account_locked',
  RATE_LIMIT_EXCEEDED = 'rate_limit_exceeded',
  IP_BLOCKED = 'ip_blocked',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  SQL_INJECTION_ATTEMPT = 'sql_injection_attempt',
  XSS_ATTEMPT = 'xss_attempt',
  CSRF_FAILURE = 'csrf_failure',
  UNAUTHORIZED_ACCESS = 'unauthorized_access',
  DATA_BREACH_ATTEMPT = 'data_breach_attempt',
  API_KEY_LEAKED = 'api_key_leaked',
  MULTIPLE_FAILED_2FA = 'multiple_failed_2fa',
}

/**
 * Log security event
 */
export async function logSecurityEvent(
  eventType: SecurityEventType | string,
  data: Record<string, any>
): Promise<void> {
  const event = {
    type: eventType,
    timestamp: new Date().toISOString(),
    ...data,
  };

  // Store event
  const key = `security:event:${Date.now()}:${Math.random().toString(36).substring(7)}`;
  await redis.set(key, JSON.stringify(event), { ex: 2592000 }); // 30 days

  // Add to sorted set for querying
  await redis.zadd('security:events', {
    score: Date.now(),
    member: key,
  });

  // Keep only last 100,000 events
  await redis.zremrangebyrank('security:events', 0, -100001);

  // Check if event should trigger alert
  const severity = getEventSeverity(eventType);
  if (shouldAlert(eventType, severity)) {
    await sendAlert(eventType, event, severity);
  }

  // Update metrics
  await updateSecurityMetrics(eventType);
}

/**
 * Get event severity
 */
function getEventSeverity(eventType: string): AlertSeverity {
  const severityMap: Record<string, AlertSeverity> = {
    [SecurityEventType.FAILED_LOGIN]: AlertSeverity.LOW,
    [SecurityEventType.ACCOUNT_LOCKED]: AlertSeverity.MEDIUM,
    [SecurityEventType.RATE_LIMIT_EXCEEDED]: AlertSeverity.LOW,
    [SecurityEventType.IP_BLOCKED]: AlertSeverity.MEDIUM,
    [SecurityEventType.SUSPICIOUS_ACTIVITY]: AlertSeverity.MEDIUM,
    [SecurityEventType.SQL_INJECTION_ATTEMPT]: AlertSeverity.HIGH,
    [SecurityEventType.XSS_ATTEMPT]: AlertSeverity.HIGH,
    [SecurityEventType.CSRF_FAILURE]: AlertSeverity.MEDIUM,
    [SecurityEventType.UNAUTHORIZED_ACCESS]: AlertSeverity.HIGH,
    [SecurityEventType.DATA_BREACH_ATTEMPT]: AlertSeverity.CRITICAL,
    [SecurityEventType.API_KEY_LEAKED]: AlertSeverity.CRITICAL,
    [SecurityEventType.MULTIPLE_FAILED_2FA]: AlertSeverity.HIGH,
  };

  return severityMap[eventType] || AlertSeverity.LOW;
}

/**
 * Check if event should trigger alert
 */
function shouldAlert(eventType: string, severity: AlertSeverity): boolean {
  // Always alert on high and critical events
  if (severity === AlertSeverity.HIGH || severity === AlertSeverity.CRITICAL) {
    return true;
  }

  // Alert on medium severity if threshold exceeded
  if (severity === AlertSeverity.MEDIUM) {
    return Math.random() < 0.3; // Sample 30% of medium events
  }

  return false;
}

/**
 * Send security alert
 */
async function sendAlert(
  eventType: string,
  event: Record<string, any>,
  severity: AlertSeverity
): Promise<void> {
  const alertMessage = formatAlertMessage(eventType, event, severity);

  // Send to Slack
  if (SLACK_WEBHOOK_URL) {
    await sendSlackAlert(alertMessage, severity);
  }

  // Send email alert
  if (ALERT_EMAIL && (severity === AlertSeverity.HIGH || severity === AlertSeverity.CRITICAL)) {
    await sendEmailAlert(alertMessage, severity);
  }

  // Store alert
  await redis.lpush('security:alerts', JSON.stringify({
    eventType,
    severity,
    timestamp: new Date().toISOString(),
    event,
  }));

  await redis.ltrim('security:alerts', 0, 999); // Keep last 1000 alerts
}

/**
 * Format alert message
 */
function formatAlertMessage(
  eventType: string,
  event: Record<string, any>,
  severity: AlertSeverity
): string {
  const emoji = {
    [AlertSeverity.LOW]: '🔵',
    [AlertSeverity.MEDIUM]: '🟡',
    [AlertSeverity.HIGH]: '🟠',
    [AlertSeverity.CRITICAL]: '🔴',
  };

  let message = `${emoji[severity]} **Security Alert: ${eventType}**\n`;
  message += `Severity: ${severity.toUpperCase()}\n`;
  message += `Time: ${event.timestamp}\n\n`;

  // Add relevant details
  if (event.ip) message += `IP: ${event.ip}\n`;
  if (event.userId) message += `User ID: ${event.userId}\n`;
  if (event.path) message += `Path: ${event.path}\n`;
  if (event.method) message += `Method: ${event.method}\n`;
  if (event.reason) message += `Reason: ${event.reason}\n`;
  if (event.details) message += `Details: ${JSON.stringify(event.details, null, 2)}\n`;

  return message;
}

/**
 * Send Slack alert
 */
async function sendSlackAlert(message: string, severity: AlertSeverity): Promise<void> {
  if (!SLACK_WEBHOOK_URL) return;

  const color = {
    [AlertSeverity.LOW]: '#0000FF',
    [AlertSeverity.MEDIUM]: '#FFFF00',
    [AlertSeverity.HIGH]: '#FFA500',
    [AlertSeverity.CRITICAL]: '#FF0000',
  };

  try {
    await fetch(SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attachments: [
          {
            color: color[severity],
            text: message,
            footer: 'Alojamento Insight Security System',
            ts: Math.floor(Date.now() / 1000),
          },
        ],
      }),
    });
  } catch (error) {
    console.error('Failed to send Slack alert:', error);
  }
}

/**
 * Send email alert
 */
async function sendEmailAlert(message: string, severity: AlertSeverity): Promise<void> {
  if (!ALERT_EMAIL) return;

  // Implement email sending (use your email service)
  console.log(`[EMAIL ALERT] To: ${ALERT_EMAIL}\n${message}`);
}

/**
 * Update security metrics
 */
async function updateSecurityMetrics(eventType: string): Promise<void> {
  const date = new Date().toISOString().split('T')[0];
  const hourKey = new Date().toISOString().substring(0, 13); // YYYY-MM-DDTHH

  // Increment daily counter
  await redis.hincrby(`security:metrics:daily:${date}`, eventType, 1);
  await redis.expire(`security:metrics:daily:${date}`, 2592000); // 30 days

  // Increment hourly counter
  await redis.hincrby(`security:metrics:hourly:${hourKey}`, eventType, 1);
  await redis.expire(`security:metrics:hourly:${hourKey}`, 604800); // 7 days

  // Increment total counter
  await redis.hincrby('security:metrics:total', eventType, 1);
}

/**
 * Get security metrics
 */
export async function getSecurityMetrics(
  period: 'hour' | 'day' | 'total' = 'day'
): Promise<Record<string, number>> {
  let key: string;

  if (period === 'hour') {
    const hourKey = new Date().toISOString().substring(0, 13);
    key = `security:metrics:hourly:${hourKey}`;
  } else if (period === 'day') {
    const date = new Date().toISOString().split('T')[0];
    key = `security:metrics:daily:${date}`;
  } else {
    key = 'security:metrics:total';
  }

  const metrics = await redis.hgetall(key);
  return metrics as Record<string, number>;
}

/**
 * Get recent security events
 */
export async function getRecentSecurityEvents(
  limit: number = 100,
  eventType?: string
): Promise<any[]> {
  const keys = await redis.zrange('security:events', -limit, -1);

  const events = await Promise.all(
    keys.map(async (key) => {
      const data = await redis.get(key);
      return data ? JSON.parse(data as string) : null;
    })
  );

  let filtered = events.filter(Boolean);

  if (eventType) {
    filtered = filtered.filter((event) => event.type === eventType);
  }

  return filtered.reverse(); // Most recent first
}

/**
 * Get security alerts
 */
export async function getSecurityAlerts(limit: number = 100): Promise<any[]> {
  const alerts = await redis.lrange('security:alerts', 0, limit - 1);
  return alerts.map((alert) => JSON.parse(alert));
}

/**
 * Detect anomalies in security events
 */
export async function detectAnomalies(): Promise<{
  detected: boolean;
  anomalies: string[];
}> {
  const metrics = await getSecurityMetrics('hour');
  const anomalies: string[] = [];

  // Check for unusual spike in failed logins
  const failedLogins = metrics[SecurityEventType.FAILED_LOGIN] || 0;
  if (failedLogins > 100) {
    anomalies.push(`High number of failed logins: ${failedLogins}`);
  }

  // Check for SQL injection attempts
  const sqlInjection = metrics[SecurityEventType.SQL_INJECTION_ATTEMPT] || 0;
  if (sqlInjection > 0) {
    anomalies.push(`SQL injection attempts detected: ${sqlInjection}`);
  }

  // Check for XSS attempts
  const xssAttempts = metrics[SecurityEventType.XSS_ATTEMPT] || 0;
  if (xssAttempts > 0) {
    anomalies.push(`XSS attempts detected: ${xssAttempts}`);
  }

  // Check for rate limit violations
  const rateLimitViolations = metrics[SecurityEventType.RATE_LIMIT_EXCEEDED] || 0;
  if (rateLimitViolations > 1000) {
    anomalies.push(`High rate limit violations: ${rateLimitViolations}`);
  }

  return {
    detected: anomalies.length > 0,
    anomalies,
  };
}

/**
 * Generate security report
 */
export async function generateSecurityReport(days: number = 7): Promise<{
  summary: Record<string, number>;
  topEvents: Array<{ type: string; count: number }>;
  alerts: any[];
  anomalies: string[];
}> {
  const summary: Record<string, number> = {};
  const eventCounts: Record<string, number> = {};

  // Collect metrics for each day
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];

    const metrics = await redis.hgetall(`security:metrics:daily:${dateStr}`);

    for (const [eventType, count] of Object.entries(metrics)) {
      summary[eventType] = (summary[eventType] || 0) + parseInt(count as string, 10);
      eventCounts[eventType] = (eventCounts[eventType] || 0) + parseInt(count as string, 10);
    }
  }

  // Get top events
  const topEvents = Object.entries(eventCounts)
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Get recent alerts
  const alerts = await getSecurityAlerts(50);

  // Detect anomalies
  const { anomalies } = await detectAnomalies();

  return {
    summary,
    topEvents,
    alerts,
    anomalies,
  };
}
