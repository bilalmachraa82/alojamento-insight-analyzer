
// Platform-specific enhanced actors configuration
export const ENHANCED_PLATFORM_CONFIG = {
  booking: {
    actorId: "runtime/booking-scraper",
    dataPoints: ["property", "pricing", "amenities", "reviews", "location", "images"],
    defaultInput: {
      maxItems: 1,
      language: "en-US",
      currency: "USD",
      checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ahead
      checkOut: new Date(Date.now() + 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 33 days ahead (3 nights)
      rooms: 1,
      adults: 2,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  airbnb: {
    actorId: "tri_angle/airbnb-scraper", // ✅ Officially maintained by Apify, 10K+ runs
    dataPoints: ["listing", "pricing", "amenities", "reviews", "host", "images"],
    defaultInput: {
      maxListings: 1,
      currency: "USD",
      calendarMonths: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "powerai/vrbo-listing-scraper",
    dataPoints: ["property", "pricing", "amenities", "reviews", "images"],
    defaultInput: {
      maxResults: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getEnhancedActorConfig = (platform: string) => {
  const config = ENHANCED_PLATFORM_CONFIG[platform.toLowerCase()];
  if (!config) {
    // Default to Booking.com actor if platform not recognized
    return ENHANCED_PLATFORM_CONFIG.booking;
  }
  return config;
};
