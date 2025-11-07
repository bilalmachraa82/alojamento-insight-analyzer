import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SystemHealth {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime?: number;
  error?: string;
  details?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify user is admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if user is admin
    const { data: profile } = await supabaseClient
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !['admin', 'super_admin'].includes(profile.role)) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const healthChecks: SystemHealth[] = [];

    // Check Database Health
    const dbStart = Date.now();
    try {
      await supabaseClient.from('diagnostic_submissions').select('id').limit(1);
      healthChecks.push({
        service: 'database',
        status: 'healthy',
        responseTime: Date.now() - dbStart,
      });
    } catch (error) {
      healthChecks.push({
        service: 'database',
        status: 'down',
        error: error.message,
      });
    }

    // Check Storage Health
    const storageStart = Date.now();
    try {
      const { data: buckets } = await supabaseClient.storage.listBuckets();
      healthChecks.push({
        service: 'storage',
        status: buckets ? 'healthy' : 'degraded',
        responseTime: Date.now() - storageStart,
        details: { bucketCount: buckets?.length || 0 },
      });
    } catch (error) {
      healthChecks.push({
        service: 'storage',
        status: 'down',
        error: error.message,
      });
    }

    // Check Edge Functions (by checking if we can read function configs)
    const edgeFunctionsStart = Date.now();
    try {
      // We're currently running, so edge functions are working
      healthChecks.push({
        service: 'edge_functions',
        status: 'healthy',
        responseTime: Date.now() - edgeFunctionsStart,
      });
    } catch (error) {
      healthChecks.push({
        service: 'edge_functions',
        status: 'down',
        error: error.message,
      });
    }

    // Check API Services Health (from recent logs)
    const { data: recentApiLogs } = await supabaseClient
      .from('api_usage_logs')
      .select('service_name, success, created_at')
      .gte('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });

    const apiServices = ['apify', 'claude', 'resend'];
    for (const service of apiServices) {
      const logs = recentApiLogs?.filter(log => log.service_name === service) || [];

      if (logs.length === 0) {
        healthChecks.push({
          service,
          status: 'healthy',
          details: { recentCalls: 0, note: 'No recent activity' },
        });
      } else {
        const successRate = logs.filter(log => log.success).length / logs.length;
        healthChecks.push({
          service,
          status: successRate >= 0.9 ? 'healthy' : successRate >= 0.7 ? 'degraded' : 'down',
          details: {
            recentCalls: logs.length,
            successRate: Math.round(successRate * 100),
          },
        });
      }
    }

    // Save health checks to database
    for (const check of healthChecks) {
      await supabaseClient.from('system_health_checks').insert({
        service_name: check.service,
        status: check.status,
        response_time_ms: check.responseTime,
        error_message: check.error,
        metadata: check.details || {},
      });
    }

    // Get overall system status
    const overallStatus = healthChecks.some(c => c.status === 'down')
      ? 'down'
      : healthChecks.some(c => c.status === 'degraded')
      ? 'degraded'
      : 'healthy';

    return new Response(
      JSON.stringify({
        overall: overallStatus,
        services: healthChecks,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error checking system health:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
