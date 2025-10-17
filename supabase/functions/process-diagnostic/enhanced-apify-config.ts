
// FASE 3: Enhanced data extraction configuration
export const ENHANCED_PLATFORM_CONFIG = {
  booking: {
    actorId: "dtrungtin/booking-scraper",
    dataPoints: [
      "name", "location", "rating", "reviews", "price", "description",
      "amenities", "photos", "hotel_id", "check_in", "check_out",
      "type", "rooms", "facilities"
    ],
    defaultInput: {
      search: "", // Will be replaced with property URL
      maxItems: 1,
      checkIn: new Date().toISOString().split('T')[0],
      checkOut: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      currency: "EUR",
      language: "pt",
      proxyConfiguration: {
        useApifyProxy: true
      }
    }
  },
  airbnb: {
    actorId: "apify/airbnb-scraper",
    dataPoints: [
      "property_name", "location", "rating", "review_count", "price",
      "pricing_details", "amenities", "description", "host_info",
      "host_response_rate", "host_languages", "superhost_status",
      "reviews", "review_categories", "similar_listings",
      "calendar_availability", "instant_book", "cancellation_policy",
      "property_type", "bedrooms", "beds", "bathrooms"
    ],
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      maxReviews: 150,
      currency: "EUR",
      language: "pt",
      includeCalendar: true,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "apify/vrbo-scraper", 
    dataPoints: [
      "property_name", "location", "rating", "review_count", "price",
      "amenities", "description", "photos", "host_info", "reviews",
      "property_type", "bedrooms", "bathrooms", "sleeps", "policies"
    ],
    defaultInput: {
      maxListings: 1,
      includeReviews: true,
      maxReviews: 100,
      currency: "EUR",
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getEnhancedActorConfig = (platform: string) => {
  const config = ENHANCED_PLATFORM_CONFIG[platform.toLowerCase()];
  if (!config) {
    return {
      actorId: "apify~website-content-crawler",
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
