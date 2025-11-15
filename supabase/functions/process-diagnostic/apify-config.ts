
// Platform-specific actors configuration
export const SUPPORTED_PLATFORMS = {
  booking: {
    actorId: "runtime/booking-scraper",
    defaultInput: {
      maxItems: 1,
      language: "en-US",
      currency: "USD",
      proxyConfiguration: { useApifyProxy: true }
    }
  },
  airbnb: {
    actorId: "red.cars/airbnb-scraper",
    defaultInput: {
      maxListings: 1,
      currency: "USD",
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
  const config = SUPPORTED_PLATFORMS[platform.toLowerCase()];
  if (!config) {
    // Default to Booking.com actor if platform not recognized
    return SUPPORTED_PLATFORMS.booking;
  }
  return config;
};
