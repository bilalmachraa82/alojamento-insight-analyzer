import { corsHeaders } from "./cors.ts";
import { getEnhancedActorConfig } from "./enhanced-apify-config.ts";

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

if (!APIFY_API_TOKEN) {
  throw new Error("APIFY_API_TOKEN is required but not set");
}

export async function startEnhancedApifyRun(platform: string, startUrl: string, submissionId: string) {
  const { actorId, dataPoints, defaultInput } = getEnhancedActorConfig(platform);
  
  console.log(`[EnhancedApify] ============= SCRAPING START =============`);
  console.log(`[EnhancedApify] Platform: ${platform}`);
  console.log(`[EnhancedApify] Submission: ${submissionId}`);
  console.log(`[EnhancedApify] URL: ${startUrl}`);
  console.log(`[EnhancedApify] Default Actor: ${actorId}`);
  console.log(`[EnhancedApify] Data points: ${dataPoints.join(', ')}`);
  
  // PRIORITY OVERRIDE SYSTEM (from highest to lowest priority):
  // 1. APIFY_TASK_ID_<PLATFORM> - Platform-specific task (e.g., APIFY_TASK_ID_BOOKING)
  // 2. APIFY_TASK_ID - Global task (works for all platforms)
  // 3. APIFY_ACTOR_ID - Global actor override
  // 4. Platform default - Hardcoded actor from config (fallback)
  
  const platformUpper = platform.toUpperCase();
  const platformTaskId = Deno.env.get(`APIFY_TASK_ID_${platformUpper}`);
  const globalTaskId = Deno.env.get("APIFY_TASK_ID");
  const globalActorId = Deno.env.get("APIFY_ACTOR_ID");
  
  console.log(`[EnhancedApify] ============= CONFIG PRIORITY =============`);
  console.log(`[EnhancedApify] 1️⃣ Platform Task (APIFY_TASK_ID_${platformUpper}): ${platformTaskId || '❌ not set'}`);
  console.log(`[EnhancedApify] 2️⃣ Global Task (APIFY_TASK_ID): ${globalTaskId || '❌ not set'}`);
  console.log(`[EnhancedApify] 3️⃣ Global Actor (APIFY_ACTOR_ID): ${globalActorId || '❌ not set'}`);
  console.log(`[EnhancedApify] 4️⃣ Platform Default Actor: ${actorId}`);
  
  // Configure actor input with platform-specific settings
  const actorInput = {
    ...defaultInput,
    startUrls: [{ url: startUrl }],
    customData: {
      submissionId,
      platform,
      extractionPoints: dataPoints
    }
  };

  // Determine which endpoint to use based on priority
  let startEndpoint = "";
  let selectedConfig = "";
  
  if (platformTaskId) {
    // PRIORITY 1: Platform-specific task
    const apiTaskId = platformTaskId.replace('/', '~');
    startEndpoint = `https://api.apify.com/v2/actor-tasks/${apiTaskId}/runs?token=${APIFY_API_TOKEN}`;
    selectedConfig = `Platform Task (APIFY_TASK_ID_${platformUpper})`;
    console.log(`[EnhancedApify] ✅ Using Platform Task: ${platformTaskId}`);
  } else if (globalTaskId) {
    // PRIORITY 2: Global task
    const apiTaskId = globalTaskId.replace('/', '~');
    startEndpoint = `https://api.apify.com/v2/actor-tasks/${apiTaskId}/runs?token=${APIFY_API_TOKEN}`;
    selectedConfig = "Global Task (APIFY_TASK_ID)";
    console.log(`[EnhancedApify] ✅ Using Global Task: ${globalTaskId}`);
  } else if (globalActorId) {
    // PRIORITY 3: Global actor override
    const apiActorId = globalActorId.replace('/', '~');
    startEndpoint = `https://api.apify.com/v2/acts/${apiActorId}/runs?token=${APIFY_API_TOKEN}`;
    selectedConfig = "Global Actor Override (APIFY_ACTOR_ID)";
    console.log(`[EnhancedApify] ✅ Using Global Actor: ${globalActorId}`);
  } else {
    // PRIORITY 4: Platform default actor
    const apiActorId = actorId.replace('/', '~');
    startEndpoint = `https://api.apify.com/v2/acts/${apiActorId}/runs?token=${APIFY_API_TOKEN}`;
    selectedConfig = "Platform Default Actor";
    console.log(`[EnhancedApify] ✅ Using Platform Default: ${actorId}`);
  }

  console.log(`[EnhancedApify] ============= FINAL CONFIG =============`);
  console.log(`[EnhancedApify] Selected: ${selectedConfig}`);
  console.log(`[EnhancedApify] Endpoint: ${startEndpoint.replace(APIFY_API_TOKEN, 'HIDDEN')}`);
  
  try {
    const runResponse = await fetch(startEndpoint, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": `Bearer ${APIFY_API_TOKEN}`,
        "X-Apify-Submission-Id": submissionId 
      },
      body: JSON.stringify(actorInput),
    });

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error(`[EnhancedApify] API error: ${errorText}`);
      throw new Error(`Actor start failed: ${runResponse.status} - ${errorText}`);
    }

    const runData = await runResponse.json();
    const runId = runData.data.id;
    console.log(`[EnhancedApify] Run started successfully. Run ID: ${runId}`);
    
    return { 
      success: true, 
      data: runData.data,
      runId,
      extractedDataPoints: dataPoints,
      actorId
    };
    
  } catch (error) {
    console.error("[EnhancedApify] Error starting run:", error);
    return { 
      success: false, 
      error: String(error)
    };
  }
}

export async function getRunResults(runId: string) {
  const resultsUrl = `https://api.apify.com/v2/actor-runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`;
  
  try {
    const response = await fetch(resultsUrl);
    if (response.ok) {
      const results = await response.json();
      return { success: true, data: results };
    }
    throw new Error(`Failed to get results: ${response.status}`);
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
