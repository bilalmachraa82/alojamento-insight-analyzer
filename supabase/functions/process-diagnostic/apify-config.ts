
// Platform-specific actors configuration
// Using PAY-PER-RESULT actors (no monthly rental required)
export const SUPPORTED_PLATFORMS: Record<string, {
  actorId: string;
  defaultInput: Record<string, any>;
}> = {
  booking: {
    actorId: "crucial_binoculars/booking-com-reviews-scraper", // Pay per result: $1.00/1,000 results
    defaultInput: {
      maxReviews: 50,
      language: "en",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  agoda: {
    actorId: "eC53oEoee74OTExo3", // Fast Agoda Reviews Scraper
    defaultInput: {
      maxItems: 1,
      language: "en-US",
      currency: "USD",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  airbnb: {
    actorId: "GsNzxEKzE2vQ5d9HN", // Airbnb Scraper - official Apify API
    defaultInput: {
      maxListings: 1,
      currency: "EUR",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  vrbo: {
    actorId: "powerai/vrbo-listing-scraper",
    defaultInput: {
      maxResults: 1,
      proxyConfiguration: { useApifyProxy: true }
    }
  }
};

export const getActorConfig = (platform: string) => {
  const normalizedPlatform = platform.toLowerCase().replace('.com', '');
  const config = SUPPORTED_PLATFORMS[normalizedPlatform];
  if (!config) {
    // Default to Booking.com actor if platform not recognized
    return SUPPORTED_PLATFORMS.booking;
  }
  return config;
};
