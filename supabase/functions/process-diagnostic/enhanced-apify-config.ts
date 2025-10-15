
// FASE 3: Enhanced data extraction configuration
export const ENHANCED_PLATFORM_CONFIG = {
  booking: {
    actorId: "voyager/booking-reviews-scraper",
    dataPoints: [
      "property_name", "location", "rating", "review_count", "price", "price_breakdown",
      "seasonal_pricing", "amenities", "description", "photos", "photo_count",
      "host_info", "host_response_rate", "host_response_time", "reviews",
      "review_categories", "nearby_attractions", "competitor_properties",
      "availability_calendar", "cancellation_policy", "check_in_out_times",
      "house_rules", "property_type", "number_of_rooms", "max_guests", "facilities_detailed"
    ],
    defaultInput: {
      maxReviews: 150,
      language: "pt",
      includeReviewDetails: true,
      extractPricing: true,
      extractAmenities: true,
      proxyConfiguration: {
        useApifyProxy: true,
        apifyProxyGroups: ["RESIDENTIAL"]
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
