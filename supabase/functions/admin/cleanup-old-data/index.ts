import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    // Parse retention periods from request (in days)
    const {
      errorLogsRetentionDays = 90,
      systemHealthChecksRetentionDays = 30,
      apiUsageLogsRetentionDays = 90,
      completedSubmissionsRetentionDays = 180,
    } = await req.json().catch(() => ({}));

    const results = {
      errorLogs: 0,
      systemHealthChecks: 0,
      apiUsageLogs: 0,
      completedSubmissions: 0,
      auditLogs: 0,
    };

    // Clean up old error logs
    const errorLogsCutoff = new Date();
    errorLogsCutoff.setDate(errorLogsCutoff.getDate() - errorLogsRetentionDays);

    const { data: deletedErrors, error: errorLogsError } = await supabaseClient
      .from('error_logs')
      .delete()
      .lt('created_at', errorLogsCutoff.toISOString())
      .eq('resolved', true)
      .select('id');

    if (!errorLogsError) {
      results.errorLogs = deletedErrors?.length || 0;
    }

    // Clean up old system health checks
    const healthChecksCutoff = new Date();
    healthChecksCutoff.setDate(healthChecksCutoff.getDate() - systemHealthChecksRetentionDays);

    const { data: deletedHealthChecks, error: healthChecksError } = await supabaseClient
      .from('system_health_checks')
      .delete()
      .lt('checked_at', healthChecksCutoff.toISOString())
      .select('id');

    if (!healthChecksError) {
      results.systemHealthChecks = deletedHealthChecks?.length || 0;
    }

    // Clean up old API usage logs
    const apiLogsCutoff = new Date();
    apiLogsCutoff.setDate(apiLogsCutoff.getDate() - apiUsageLogsRetentionDays);

    const { data: deletedApiLogs, error: apiLogsError } = await supabaseClient
      .from('api_usage_logs')
      .delete()
      .lt('created_at', apiLogsCutoff.toISOString())
      .select('id');

    if (!apiLogsError) {
      results.apiUsageLogs = deletedApiLogs?.length || 0;
    }

    // Clean up old completed submissions (keep data, just anonymize)
    const submissionsCutoff = new Date();
    submissionsCutoff.setDate(submissionsCutoff.getDate() - completedSubmissionsRetentionDays);

    const { data: anonymizedSubmissions, error: submissionsError } = await supabaseClient
      .from('diagnostic_submissions')
      .update({
        name: 'ANONYMIZED',
        email: 'anonymized@example.com',
      })
      .eq('status', 'completed')
      .lt('created_at', submissionsCutoff.toISOString())
      .neq('email', 'anonymized@example.com')
      .select('id');

    if (!submissionsError) {
      results.completedSubmissions = anonymizedSubmissions?.length || 0;
    }

    // Clean up old audit logs (keep last 1 year)
    const auditLogsCutoff = new Date();
    auditLogsCutoff.setFullYear(auditLogsCutoff.getFullYear() - 1);

    const { data: deletedAuditLogs, error: auditLogsError } = await supabaseClient
      .from('admin_audit_logs')
      .delete()
      .lt('created_at', auditLogsCutoff.toISOString())
      .select('id');

    if (!auditLogsError) {
      results.auditLogs = deletedAuditLogs?.length || 0;
    }

    // Log cleanup action
    await supabaseClient.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'CLEANUP_OLD_DATA',
      resource_type: 'system',
      new_value: {
        retention_days: {
          errorLogs: errorLogsRetentionDays,
          systemHealthChecks: systemHealthChecksRetentionDays,
          apiUsageLogs: apiUsageLogsRetentionDays,
          completedSubmissions: completedSubmissionsRetentionDays,
        },
        results,
      },
    });

    return new Response(
      JSON.stringify({
        message: 'Cleanup completed successfully',
        results,
        total: Object.values(results).reduce((sum, count) => sum + count, 0),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
