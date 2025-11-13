
// OPÇÃO 2: Universal configuration using website-content-crawler for all platforms
const universalEnhancedConfig = {
  actorId: "apify/website-content-crawler",
  dataPoints: ["content", "metadata", "structured_data"],
  defaultInput: {
    maxCrawlPages: 1,
    crawlerType: "playwright:chrome",
    saveHtml: false,
    saveMarkdown: true,
    saveScreenshots: false,
    waitForDynamicContent: true,
    maxScrollHeight: 10000,
    htmlTransformer: "readableText",
    removeElements: [
      ".cookie-banner", ".cookie-consent", "nav", "header", 
      "footer", ".advertisement", ".ad-container", ".popup"
    ],
    proxyConfiguration: { useApifyProxy: true }
  }
};

export const ENHANCED_PLATFORM_CONFIG = {
  booking: universalEnhancedConfig,
  airbnb: universalEnhancedConfig,
  vrbo: universalEnhancedConfig
};

export const getEnhancedActorConfig = (platform: string) => {
  const config = ENHANCED_PLATFORM_CONFIG[platform.toLowerCase()];
  if (!config) {
    return universalEnhancedConfig;
  }
  return config;
};
