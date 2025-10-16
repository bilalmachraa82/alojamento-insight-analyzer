/**
 * Environment Variable Validator
 * Validates required environment variables at edge function startup
 * Provides clear error messages for missing configuration
 */

export interface EnvConfig {
  required: string[];
  optional?: string[];
}

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
  values: Record<string, string | undefined>;
}

/**
 * Validates that all required environment variables are present
 * @param config - Configuration object with required and optional env vars
 * @returns Validation result with missing vars and warnings
 */
export function validateEnv(config: EnvConfig): ValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];
  const values: Record<string, string | undefined> = {};

  // Check required variables
  for (const varName of config.required) {
    const value = Deno.env.get(varName);
    values[varName] = value;

    if (!value || value.trim() === '') {
      missing.push(varName);
    }
  }

  // Check optional variables (warnings only)
  if (config.optional) {
    for (const varName of config.optional) {
      const value = Deno.env.get(varName);
      values[varName] = value;

      if (!value || value.trim() === '') {
        warnings.push(varName);
      }
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
    values,
  };
}

/**
 * Validates environment and throws detailed error if invalid
 * Use this at the start of your edge function handler
 * @param config - Configuration object with required and optional env vars
 * @throws Error with details about missing variables
 */
export function requireEnv(config: EnvConfig): Record<string, string> {
  const result = validateEnv(config);

  if (!result.valid) {
    const errorMessage = `
❌ Missing required environment variables:
${result.missing.map(v => `  - ${v}`).join('\n')}

📝 How to fix:
  1. Via Supabase Dashboard:
     https://app.supabase.com/project/_/functions
     → Edge Functions → Manage secrets
     → Add missing variables

  2. Via Supabase CLI:
     ${result.missing.map(v => `supabase secrets set ${v}=your_value_here`).join('\n     ')}

  3. For local development:
     Create .env.local file with:
     ${result.missing.map(v => `${v}=your_value_here`).join('\n     ')}

💡 See .env.example for documentation on where to get these values.
    `.trim();

    console.error(errorMessage);
    throw new Error(`Missing required environment variables: ${result.missing.join(', ')}`);
  }

  // Log warnings for optional variables
  if (result.warnings.length > 0) {
    console.warn(
      '⚠️  Optional environment variables not set:',
      result.warnings.join(', ')
    );
  }

  // Return only the required values (filtered to remove undefined)
  const requiredValues: Record<string, string> = {};
  for (const varName of config.required) {
    const value = result.values[varName];
    if (value) {
      requiredValues[varName] = value;
    }
  }

  return requiredValues;
}

/**
 * Creates a response object for missing environment variables
 * Use this to return proper error responses to clients
 */
export function createEnvErrorResponse(missing: string[]): Response {
  return new Response(
    JSON.stringify({
      error: 'Configuration error',
      code: 'MISSING_ENV_VARS',
      message: 'Server is missing required configuration. Please contact support.',
      details: {
        missing: missing,
        hint: 'Administrator: Check edge function secrets in Supabase dashboard',
      },
    }),
    {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    }
  );
}

/**
 * Validates and returns environment variables or error response
 * Convenience function that combines validation and error response creation
 */
export function validateEnvOrError(
  config: EnvConfig
): { env: Record<string, string> } | { error: Response } {
  const result = validateEnv(config);

  if (!result.valid) {
    console.error('❌ Environment validation failed:', result.missing);
    return { error: createEnvErrorResponse(result.missing) };
  }

  const env: Record<string, string> = {};
  for (const varName of config.required) {
    const value = result.values[varName];
    if (value) {
      env[varName] = value;
    }
  }

  // Log successful validation
  console.log('✅ Environment validation passed');
  if (result.warnings.length > 0) {
    console.warn('⚠️  Optional vars not set:', result.warnings.join(', '));
  }

  return { env };
}

// =====================================================
// COMMON CONFIGURATIONS (DRY - Don't Repeat Yourself)
// =====================================================

export const SUPABASE_ENV: EnvConfig = {
  required: ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'],
};

export const APIFY_ENV: EnvConfig = {
  required: ['APIFY_API_TOKEN'],
};

export const CLAUDE_ENV: EnvConfig = {
  required: ['CLAUDE_API_KEY'],
};

// Combined configs for common use cases
export const SCRAPER_ENV: EnvConfig = {
  required: [...SUPABASE_ENV.required, ...APIFY_ENV.required],
};

export const ANALYZER_ENV: EnvConfig = {
  required: [...SUPABASE_ENV.required, ...CLAUDE_ENV.required],
};

export const FULL_PIPELINE_ENV: EnvConfig = {
  required: [
    ...SUPABASE_ENV.required,
    ...APIFY_ENV.required,
    ...CLAUDE_ENV.required,
  ],
};
