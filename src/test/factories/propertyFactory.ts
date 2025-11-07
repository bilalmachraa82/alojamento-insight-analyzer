export const createMockProperty = (overrides = {}) => ({
  id: 'test-property-id',
  user_id: 'test-user-id',
  name: 'Test Property',
  property_url: 'https://booking.com/test-property',
  platform: 'booking',
  location: 'Lisbon, Portugal',
  property_type: 'apartment',
  bedrooms: 2,
  bathrooms: 1,
  max_guests: 4,
  amenities: {
    wifi: true,
    kitchen: true,
    parking: true,
    pool: false,
    air_conditioning: true,
  },
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ],
  description: 'A lovely test property',
  is_active: true,
  analysis_count: 0,
  last_analyzed: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides,
});

export const createMockBookingData = (overrides = {}) => ({
  hotel_name: 'Test Hotel',
  address: 'Test Address, Lisbon',
  hotel_type: 'Hotel',
  description: 'A wonderful test hotel',
  rating: 8.5,
  review_count: 150,
  price: '€100',
  amenities: ['WiFi', 'Parking', 'Pool', 'Air Conditioning'],
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ],
  check_in_time: '14:00',
  check_out_time: '11:00',
  cancellation_policy: 'Free cancellation',
  ...overrides,
});

export const createMockAirbnbData = (overrides = {}) => ({
  name: 'Test Airbnb Property',
  location: 'Lisbon, Portugal',
  room_type: 'Entire place',
  description: 'A cozy test property',
  rating: 95,
  number_of_reviews: 75,
  price: 100,
  amenities: ['WiFi', 'Kitchen', 'Parking'],
  photos: [
    'https://example.com/photo1.jpg',
    'https://example.com/photo2.jpg',
  ],
  check_in_time: '15:00',
  check_out_time: '10:00',
  cleaning_fee: 25,
  ...overrides,
});

export const createMockProcessedPropertyData = (overrides = {}) => ({
  basicInfo: {
    name: 'Test Property',
    location: 'Lisbon, Portugal',
    propertyType: 'apartment',
    description: 'A test property',
  },
  performance: {
    rating: 4.5,
    reviewCount: 100,
    occupancyRate: 75,
    averageDailyRate: 120,
  },
  amenities: ['WiFi', 'Kitchen', 'Parking'],
  photos: ['https://example.com/photo1.jpg'],
  pricing: {
    basePrice: 100,
    cleaningFee: 25,
    additionalFees: {},
    discounts: {},
  },
  policies: {
    checkIn: '14:00',
    checkOut: '11:00',
    cancellationPolicy: 'Free cancellation',
    houseRules: ['No smoking', 'No pets'],
  },
  rawData: {},
  ...overrides,
});
