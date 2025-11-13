import { corsHeaders } from "./cors.ts";
import { getEnhancedActorConfig } from "./enhanced-apify-config.ts";

const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

if (!APIFY_API_TOKEN) {
  throw new Error("APIFY_API_TOKEN is required but not set");
}

export async function startEnhancedApifyRun(platform: string, startUrl: string, submissionId: string) {
  const { actorId, defaultInput, dataPoints } = getEnhancedActorConfig(platform);
  
  // Enhanced input with comprehensive extraction
  const actorInput = {
    ...defaultInput,
    startUrls: [{ url: startUrl }],
    // Increase timeout and scroll for better data extraction
    pageLoadTimeoutSecs: 120,
    maxScrollHeight: 15000,
    waitForDynamicContent: true,
    // Add extraction instructions based on platform
    extractionRules: {
      fields: dataPoints,
      waitForSelectors: platform === 'booking' ? [
        '.hp_hotel_name', '.bui-review-score__badge', '.hp-description',
        '.hotel_description', '.c-section-title', '[data-testid="property-description"]'
      ] :
      platform === 'airbnb' ? [
        '[data-testid="listing-title"]', '[data-testid="review-summary"]',
        '[data-section-id="DESCRIPTION_DEFAULT"]', '[data-section-id="AMENITIES_DEFAULT"]'
      ] :
      platform === 'vrbo' ? ['.headline', '.review-summary', '.property-description'] : 
      []
    },
    // Enhanced screenshots and content capture
    saveScreenshots: true,
    saveMarkdown: true,
    saveHtml: true
  };

  console.log(`[EnhancedApify] Starting extraction for ${platform} with ${dataPoints.length} data points`);

  // Start actor run without waiting (async processing)
  // IMPORTANT: Apify API uses ~ instead of / in actor IDs for the endpoint
  const apiActorId = actorId.replace('/', '~');
  const enhancedApiUrl = `https://api.apify.com/v2/acts/${apiActorId}/runs?token=${APIFY_API_TOKEN}`;
  console.log(`[EnhancedApify] API URL: ${enhancedApiUrl.replace(APIFY_API_TOKEN, 'HIDDEN')}`);
  console.log(`[EnhancedApify] Actor ID: ${actorId} -> API: ${apiActorId}`);
  
  try {
    const runResponse = await fetch(enhancedApiUrl, {
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
  const resultsUrl = `https://api.apify.com/v2/acts/runs/${runId}/dataset/items?token=${APIFY_API_TOKEN}`;
  
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
