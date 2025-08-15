
export const ENHANCED_PLATFORM_CONFIG = {
  booking: {
    actorId: "voyager/booking-reviews-scraper",
    dataPoints: [
      "property_name", "location", "rating", "review_count", "amenities", 
      "room_types", "pricing", "policies", "photos", "description"
    ],
    defaultInput: {
      maxReviews: 200,
      includePhotos: true,
      includeAmenities: true,
      includePolicies: true,
      language: "en-US",
      extractPricing: true,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
      }
    }
  },
  airbnb: {
    actorId: "apify/airbnb-scraper",
    dataPoints: [
      "name", "location", "price", "rating", "reviews", "amenities",
      "host_info", "calendar", "photos", "description", "house_rules"
    ],
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      maxReviews: 200,
      includePricing: true,
      includeCalendar: true,
      includeHostInfo: true,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "apify/vrbo-scraper", 
    dataPoints: [
      "property_name", "location", "nightly_rate", "reviews", "amenities",
      "property_details", "photos", "availability", "policies"
    ],
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      includeAvailability: true,
      includePolicies: true,
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getEnhancedActorConfig = (platform: string) => {
  const config = ENHANCED_PLATFORM_CONFIG[platform.toLowerCase()];
  if (!config) {
    return {
      actorId: "apify/website-content-crawler",
      dataPoints: ["content", "metadata", "structured_data"],
      defaultInput: {
        maxCrawlPages: 1,
        crawlerType: "playwright:chrome",
        saveHtml: false,
        saveMarkdown: true,
        saveScreenshots: true,
        waitForDynamicContent: true,
        maxScrollHeight: 10000,
        htmlTransformer: "readableText",
        removeElements: [
          ".cookie-banner", ".cookie-consent", "nav", "header", 
          "footer", ".advertisement", ".ad-container", ".popup"
        ]
      }
    };
  }
  return config;
};
