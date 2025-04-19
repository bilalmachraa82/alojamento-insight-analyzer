
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

export async function updateSubmissionStatus(id: string, status: string, data: any = {}) {
  const { error } = await supabase
    .from("diagnostic_submissions")
    .update({
      status,
      scraped_data: {
        ...data,
        updated_at: new Date().toISOString()
      }
    })
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
