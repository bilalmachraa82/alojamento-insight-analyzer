
// FASE 3: Enhanced data extraction configuration
export const ENHANCED_PLATFORM_CONFIG = {
  booking: {
    actorId: "apify/web-scraper",
    dataPoints: [
      "name", "location", "rating", "reviews", "price", "description",
      "amenities", "photos", "hotel_id", "check_in", "check_out",
      "type", "rooms", "facilities"
    ],
    defaultInput: {
      startUrls: [], // Will be set dynamically
      linkSelector: "a[href]",
      pseudoUrls: [],
      pageFunction: `async function pageFunction(context) {
        const { page, request } = context;
        
        // Wait for content to load
        await page.waitForTimeout(3000);
        
        // Extract all visible text and structured data
        const data = await page.evaluate(() => {
          const result = {
            url: window.location.href,
            title: document.title,
            text: document.body.innerText,
            metadata: {}
          };
          
          // Try to extract hotel-specific data
          const nameEl = document.querySelector('.hp_hotel_name, h1[data-testid="property-title"]');
          if (nameEl) result.metadata.name = nameEl.textContent.trim();
          
          const ratingEl = document.querySelector('.bui-review-score__badge, [data-testid="rating-number"]');
          if (ratingEl) result.metadata.rating = ratingEl.textContent.trim();
          
          const descEl = document.querySelector('.hotel_description, [data-testid="property-description"]');
          if (descEl) result.metadata.description = descEl.textContent.trim();
          
          return result;
        });
        
        return data;
      }`,
      proxyConfiguration: {
        useApifyProxy: true
      },
      maxRequestsPerCrawl: 1,
      maxCrawlingDepth: 0
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
