
import { corsHeaders } from "./cors.ts";
import { getActorConfig } from "./apify-config.ts";

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

export async function startApifyRun(platform: string, startUrl: string) {
  const { actorId, defaultInput } = getActorConfig(platform);
  const actorInput = {
    ...defaultInput,
    startUrls: [{ url: startUrl }]
  };

  // Use the correct Apify Actor Runs API endpoint with Authorization header
  const apiUrl = `https://api.apify.com/v2/acts/${actorId}/runs`;
  
  try {
    console.log(`Starting Apify run for actor: ${actorId}`);
    const runResponse = await fetch(apiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${APIFY_API_TOKEN}`
      },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`Apify API request failed: ${errorText}`);
      return { 
        success: false, 
        error: `Apify API error: ${errorText}`,
        endpoint: apiUrl
      };
    }

    const runData = await runResponse.json();
    console.log(`Apify run started successfully. Run ID: ${runData.data.id}`);
    return { success: true, data: runData };
  } catch (error) {
    console.error("Error calling Apify:", error);
    return { success: false, error: String(error) };
  }
}
