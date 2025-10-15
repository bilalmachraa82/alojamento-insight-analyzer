
export const SUPPORTED_PLATFORMS = {
  booking: {
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
      ]
    }
  },
  airbnb: {
    actorId: "apify/airbnb-scraper",
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      maxReviews: 100,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "apify/vrbo-scraper",
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getActorConfig = (platform: string) => {
  const config = SUPPORTED_PLATFORMS[platform.toLowerCase()];
  if (!config) {
    return {
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
        ]
      }
    };
  }
  return config;
};
