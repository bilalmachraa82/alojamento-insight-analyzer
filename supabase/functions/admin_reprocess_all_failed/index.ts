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

    // Check if user is admin using security definer function
    const { data: isAdmin, error: roleError } = await supabaseClient
      .rpc('is_admin', { _user_id: user.id });

    if (roleError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all failed submissions
    const { data: failedSubmissions, error: fetchError } = await supabaseClient
      .from('diagnostic_submissions')
      .select('id, email, property_url, retry_count')
      .eq('status', 'failed')
      .lt('retry_count', 3) // Only reprocess if retries < 3
      .order('created_at', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    if (!failedSubmissions || failedSubmissions.length === 0) {
      return new Response(
        JSON.stringify({
          message: 'No failed submissions to reprocess',
          count: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Log admin action
    await supabaseClient.from('admin_audit_logs').insert({
      admin_id: user.id,
      action: 'REPROCESS_ALL_FAILED',
      resource_type: 'diagnostic_submissions',
      resource_id: `count:${failedSubmissions.length}`,
      new_value: { submission_ids: failedSubmissions.map(s => s.id) },
    });

    // Reprocess each submission
    const results = [];
    for (const submission of failedSubmissions) {
      try {
        // Call reprocess-submission edge function
        const reprocessResponse = await fetch(
          `${Deno.env.get('SUPABASE_URL')}/functions/v1/reprocess-submission`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ submissionId: submission.id }),
          }
        );

        const reprocessResult = await reprocessResponse.json();

        results.push({
          id: submission.id,
          status: reprocessResponse.ok ? 'queued' : 'failed',
          error: reprocessResponse.ok ? null : reprocessResult.error,
        });
      } catch (error) {
        results.push({
          id: submission.id,
          status: 'error',
          error: error.message,
        });
      }
    }

    const successCount = results.filter(r => r.status === 'queued').length;
    const failCount = results.filter(r => r.status !== 'queued').length;

    return new Response(
      JSON.stringify({
        message: `Reprocessing complete: ${successCount} queued, ${failCount} failed`,
        count: failedSubmissions.length,
        successCount,
        failCount,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error reprocessing submissions:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
