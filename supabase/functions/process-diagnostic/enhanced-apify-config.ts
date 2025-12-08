// Platform-specific enhanced actors configuration
// Using PAY-PER-RESULT actors (no monthly rental required)
export const ENHANCED_PLATFORM_CONFIG: Record<string, {
  actorId: string;
  dataPoints: string[];
  defaultInput: Record<string, any>;
}> = {
  booking: {
    actorId: "crucial_binoculars/booking-com-reviews-scraper", // Pay per result: $1.00/1,000 results
    dataPoints: ["property", "reviews", "rating"],
    defaultInput: {
      maxReviews: 50,
      language: "pt",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  airbnb: {
    actorId: "GsNzxEKzE2vQ5d9HN", // Airbnb Scraper - official Apify API
    dataPoints: ["listing", "pricing", "amenities", "reviews", "host", "images"],
    defaultInput: {
      maxListings: 1,
      currency: "EUR",
      calendarMonths: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "powerai/vrbo-listing-scraper", // VRBO Listing Scraper
    dataPoints: ["property", "pricing", "amenities", "reviews", "images"],
    defaultInput: {
      maxResults: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  agoda: {
    actorId: "eC53oEoee74OTExo3", // Fast Agoda Reviews Scraper
    dataPoints: ["property", "pricing", "amenities", "reviews", "location", "images"],
    defaultInput: {
      maxItems: 1,
      language: "pt-PT",
      currency: "EUR",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  expedia: {
    actorId: "jupri/expedia-hotels", // Expedia Hotels Scraper
    dataPoints: ["property", "pricing", "amenities", "reviews", "location"],
    defaultInput: {
      limit: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  hotels: {
    actorId: "tri_angle/expedia-hotels-com-reviews-scraper", // Hotels.com Reviews Scraper
    dataPoints: ["property", "reviews"],
    defaultInput: {
      maxReviews: 50,
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getEnhancedActorConfig = (platform: string) => {
  const normalizedPlatform = platform.toLowerCase().replace('.com', '').replace('hotels.com', 'hotels');
  const config = ENHANCED_PLATFORM_CONFIG[normalizedPlatform];
  
  if (!config) {
    console.log(`[EnhancedApify] Platform '${platform}' not found, defaulting to booking`);
    return ENHANCED_PLATFORM_CONFIG.booking;
  }
  
  return config;
};

// Helper to detect platform from URL
export const detectPlatformFromUrl = (url: string): string => {
  const urlLower = url.toLowerCase();
  
  if (urlLower.includes('booking.com')) return 'booking';
  if (urlLower.includes('airbnb.')) return 'airbnb';
  if (urlLower.includes('vrbo.com')) return 'vrbo';
  if (urlLower.includes('agoda.com')) return 'agoda';
  if (urlLower.includes('expedia.')) return 'expedia';
  if (urlLower.includes('hotels.com')) return 'hotels';
  
  return 'booking'; // Default fallback
};
