
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function updateSubmissionStatus(
  id: string,
  status: string,
  data: any = {}
) {
  const updateData: any = { status };

  // Extract specific fields that have dedicated columns
  if (data.apify_run_id) {
    updateData.actor_run_id = data.apify_run_id;
  }
  if (data.actor_id) {
    updateData.actor_id = data.actor_id;
  }
  if (data.error) {
    updateData.error_message = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
  }

  // Store remaining data in property_data
  if (Object.keys(data).length > 0) {
    updateData.property_data = data;
  }

  const { error } = await supabase
    .from("diagnostic_submissions")
    .update(updateData)
    .eq("id", id);

  if (error) {
    console.error(`Error updating submission ${id}:`, error);
    throw error;
  }
}

export async function getSubmission(id: string) {
  const { data, error } = await supabase
    .from("diagnostic_submissions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching submission:", error);
    throw error;
  }

  return data;
}
