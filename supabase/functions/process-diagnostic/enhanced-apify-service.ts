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

  // Try enhanced API endpoint first
  const enhancedApiUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}&waitForFinish=120`;
  
  try {
    const runResponse = await fetch(enhancedApiUrl, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "X-Apify-Submission-Id": submissionId 
      },
      body: JSON.stringify(actorInput),
    });

    if (runResponse.ok) {
      const runData = await runResponse.json();
      console.log(`[EnhancedApify] Enhanced extraction completed successfully`);
      
      return { 
        success: true, 
        data: runData,
        extractedDataPoints: dataPoints,
        processingTime: runData.stats?.runTimeSecs || 0
      };
    }

    // Fallback to basic extraction
    console.log("Enhanced extraction failed, falling back to basic mode");
    return await fallbackBasicExtraction(platform, startUrl, submissionId);
    
  } catch (error) {
    console.error("Enhanced Apify extraction error:", error);
    return await fallbackBasicExtraction(platform, startUrl, submissionId);
  }
}

async function fallbackBasicExtraction(platform: string, startUrl: string, submissionId: string) {
  const basicApiUrl = `https://api.apify.com/v2/acts/apify/website-content-crawler/runs?token=${APIFY_API_TOKEN}`;
  
  const basicInput = {
    startUrls: [{ url: startUrl }],
    maxCrawlPages: 1,
    crawlerType: "playwright:chrome",
    saveMarkdown: true,
    waitForDynamicContent: true
  };

  try {
    const response = await fetch(basicApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(basicInput),
    });

    if (response.ok) {
      const data = await response.json();
      return { 
        success: true, 
        data,
        extractedDataPoints: ['basic_content'],
        processingTime: 0,
        fallbackMode: true
      };
    }

    throw new Error(`Basic extraction also failed: ${response.status}`);
  } catch (error) {
    return { 
      success: false, 
      error: String(error),
      endpoints: [basicApiUrl]
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
