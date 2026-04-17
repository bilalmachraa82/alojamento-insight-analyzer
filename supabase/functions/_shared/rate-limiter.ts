/**
 * Rate Limiter for Edge Functions
 *
 * Uses the diagnostic_submissions table as a natural counter - queries recent
 * submissions by email or IP to enforce throttling. No additional storage needed.
 */

import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

export interface RateLimitConfig {
  /** Max submissions per email in the window (default: 5) */
  maxPerEmail?: number;
  /** Max submissions per IP in the window (default: 20) */
  maxPerIp?: number;
  /** Window size in hours (default: 24) */
  windowHours?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  reason?: string;
  retryAfterSeconds?: number;
}

/**
 * Extract client IP from request headers (Cloudflare / standard proxies).
 */
export function getClientIp(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp;

  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;

  return "unknown";
}

/**
 * Check if a submission should be rate-limited.
 * Returns allowed=false with a reason if the limit is exceeded.
 */
export async function checkSubmissionRateLimit(
  supabase: SupabaseClient,
  email: string,
  ip: string,
  config: RateLimitConfig = {}
): Promise<RateLimitResult> {
  const maxPerEmail = config.maxPerEmail ?? 5;
  const maxPerIp = config.maxPerIp ?? 20;
  const windowHours = config.windowHours ?? 24;

  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString();

  const { count: emailCount, error: emailError } = await supabase
    .from("diagnostic_submissions")
    .select("*", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .gte("submission_date", since);

  if (emailError) {
    console.error("[RateLimiter] Email count query failed:", emailError);
    // Fail open on DB errors - don't block users if the rate limiter itself breaks
    return { allowed: true };
  }

  if ((emailCount ?? 0) >= maxPerEmail) {
    return {
      allowed: false,
      reason: `Too many submissions for this email. Max ${maxPerEmail} per ${windowHours}h.`,
      retryAfterSeconds: windowHours * 3600,
    };
  }

  // Only check IP if we have a real one (not "unknown")
  if (ip !== "unknown") {
    const { count: ipCount, error: ipError } = await supabase
      .from("diagnostic_submissions")
      .select("*", { count: "exact", head: true })
      .eq("client_ip", ip)
      .gte("submission_date", since);

    if (ipError) {
      // Column may not exist yet - ignore IP check if so
      if (!ipError.message?.includes("client_ip")) {
        console.error("[RateLimiter] IP count query failed:", ipError);
      }
      return { allowed: true };
    }

    if ((ipCount ?? 0) >= maxPerIp) {
      return {
        allowed: false,
        reason: `Too many submissions from this network. Max ${maxPerIp} per ${windowHours}h.`,
        retryAfterSeconds: windowHours * 3600,
      };
    }
  }

  return { allowed: true };
}

/**
 * Validate a property URL against allowed domains and scheme.
 */
export function validatePropertyUrl(url: string, platform: string): { valid: boolean; error?: string } {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, error: "Invalid URL format" };
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    return { valid: false, error: "URL must use http or https" };
  }

  const allowedDomains: Record<string, string[]> = {
    airbnb: ["airbnb.com", "airbnb.pt", "airbnb.co.uk", "airbnb.es", "airbnb.fr"],
    booking: ["booking.com"],
    vrbo: ["vrbo.com"],
  };

  const domains = allowedDomains[platform.toLowerCase()];
  if (!domains) {
    return { valid: false, error: "Unsupported platform" };
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const isAllowed = domains.some((d) => hostname === d || hostname.endsWith(`.${d}`));

  if (!isAllowed) {
    return { valid: false, error: `URL must be from ${domains.join(", ")}` };
  }

  return { valid: true };
}
