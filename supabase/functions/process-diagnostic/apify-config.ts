
// Universal configuration using website-content-crawler for all platforms
const universalConfig = {
  actorId: "apify/website-content-crawler",
  defaultInput: {
    maxCrawlPages: 1,
    crawlerType: "playwright:chrome",
    saveHtml: false,
    saveMarkdown: true,
    saveScreenshots: false,
    waitForDynamicContent: true,
    maxScrollHeight: 5000,
    htmlTransformer: "readableText",
    removeElements: [
      ".cookie-banner",
      ".cookie-consent",
      "nav",
      "header",
      "footer",
      ".advertisement",
      ".ad-container"
    ],
    proxyConfiguration: { useApifyProxy: true }
  }
};

export const SUPPORTED_PLATFORMS = {
  booking: universalConfig,
  airbnb: universalConfig,
  vrbo: universalConfig
};

export const getActorConfig = (platform: string) => {
  const config = SUPPORTED_PLATFORMS[platform.toLowerCase()];
  if (!config) {
    return universalConfig;
  }
  return config;
};
