
import { corsHeaders } from "./cors.ts";
import { getActorConfig } from "./apify-config.ts";

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

export async function startApifyRun(platform: string, startUrl: string) {
  const { actorId, defaultInput } = getActorConfig(platform);
  const actorInput = {
    ...defaultInput,
    startUrls: [{ url: startUrl }]
  };

  // Try primary API endpoint format
  const primaryApiUrl = `https://api.apify.com/v2/actor-tasks/${actorId}/run-sync?token=${APIFY_API_TOKEN}`;
  try {
    const runResponse = await fetch(primaryApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
    });

    if (runResponse.ok) {
      const runData = await runResponse.json();
      return { success: true, data: runData };
    }

    // If primary endpoint fails, try alternative format
    const errorText = await runResponse.text();
    console.error(`Primary API request failed: ${errorText}`);
    
    const altApiUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`;
    const altRunResponse = await fetch(altApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(actorInput),
    });

    if (!altRunResponse.ok) {
      const altErrorText = await altRunResponse.text();
      console.error(`Alternative API request failed: ${altErrorText}`);
      return { 
        success: false, 
        error: `Primary endpoint error: ${errorText}\nAlternative endpoint error: ${altErrorText}`,
        endpoints: [primaryApiUrl, altApiUrl]
      };
    }

    const altRunData = await altRunResponse.json();
    return { success: true, data: altRunData, endpoint: "alternative" };
  } catch (error) {
    console.error("Error calling Apify:", error);
    return { success: false, error: String(error) };
  }
}
