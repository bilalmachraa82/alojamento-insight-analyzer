/**
 * Represents an amenity item from various platforms
 */
interface AmenityItem {
  name?: string;
  title?: string;
}

/**
 * Amenities data can be an array of strings, objects, or a record
 */
type AmenitiesData = string[] | AmenityItem[] | Record<string, boolean>;

/**
 * Photo item from various platforms
 */
interface PhotoItem {
  url?: string;
  src?: string;
}

/**
 * Photos data can be an array of strings or objects
 */
type PhotosData = string[] | PhotoItem[];

/**
 * Availability data structure for occupancy estimation
 */
interface AvailabilityData {
  available_days?: number;
  total_days?: number;
}

/**
 * Booking.com raw data structure
 */
export interface BookingComRawData {
  hotel_name?: string;
  name?: string;
  address?: string;
  location?: string;
  hotel_type?: string;
  property_type?: string;
  description?: string;
  hotel_description?: string;
  rating?: string | number;
  review_score?: string | number;
  review_count?: string | number;
  reviews_count?: string | number;
  price?: string | number;
  rate?: string | number;
  base_rate?: string | number;
  cleaning_fee?: string | number;
  amenities?: AmenitiesData;
  facilities?: AmenitiesData;
  photos?: PhotosData;
  images?: PhotosData;
  check_in_time?: string;
  checkin?: string;
  check_out_time?: string;
  checkout?: string;
  cancellation_policy?: string;
  house_rules?: string[];
  additional_fees?: Record<string, number>;
  discounts?: Record<string, number>;
  occupancy_rate?: number;
  availability?: AvailabilityData;
  number_of_reviews?: string | number;
  [key: string]: unknown;
}

/**
 * Airbnb raw data structure
 */
export interface AirbnbRawData {
  name?: string;
  title?: string;
  location?: string;
  city?: string;
  country?: string;
  room_type?: string;
  property_type?: string;
  description?: string;
  summary?: string;
  rating?: string | number;
  review_scores_rating?: string | number;
  number_of_reviews?: string | number;
  reviews_count?: string | number;
  price?: string | number;
  cleaning_fee?: string | number;
  service_fee?: string | number;
  occupancy_tax?: string | number;
  amenities?: AmenitiesData;
  photos?: PhotosData;
  picture_urls?: PhotosData;
  check_in_time?: string;
  check_out_time?: string;
  cancellation_policy?: string;
  house_rules?: string;
  discounts?: Record<string, number>;
  occupancy_rate?: number;
  availability?: AvailabilityData;
  review_count?: string | number;
  [key: string]: unknown;
}

/**
 * VRBO raw data structure
 */
export interface VrboRawData {
  headline?: string;
  name?: string;
  location?: string;
  address?: string;
  propertyType?: string;
  description?: string;
  averageRating?: string | number;
  rating?: string | number;
  reviewCount?: string | number;
  reviews_count?: string | number;
  nightlyRate?: string | number;
  price?: string | number;
  baseRate?: string | number;
  cleaningFee?: string | number;
  amenities?: AmenitiesData;
  photos?: PhotosData;
  checkInTime?: string;
  checkOutTime?: string;
  cancellationPolicy?: string;
  houseRules?: string[];
  fees?: Record<string, number>;
  discounts?: Record<string, number>;
  occupancy_rate?: number;
  availability?: AvailabilityData;
  number_of_reviews?: string | number;
  review_count?: string | number;
  [key: string]: unknown;
}

/**
 * Generic raw property data structure for unknown platforms
 */
export interface GenericRawData {
  name?: string;
  title?: string;
  location?: string;
  address?: string;
  type?: string;
  description?: string;
  rating?: string | number;
  reviews?: string | number;
  price?: string | number;
  amenities?: AmenitiesData;
  photos?: PhotosData;
  [key: string]: unknown;
}

/**
 * Union type for all platform raw data
 */
export type RawPropertyData = BookingComRawData | AirbnbRawData | VrboRawData | GenericRawData;

/**
 * Processed property data with standardized structure
 */
export interface ProcessedPropertyData {
  basicInfo: {
    name: string;
    location: string;
    propertyType: string;
    description?: string;
  };
  performance: {
    rating?: number;
    reviewCount?: number;
    occupancyRate?: number;
    averageDailyRate?: number;
  };
  amenities: string[];
  photos: string[];
  pricing: {
    basePrice?: number;
    cleaningFee?: number;
    additionalFees?: Record<string, number>;
    discounts?: Record<string, number>;
  };
  policies: {
    checkIn?: string;
    checkOut?: string;
    cancellationPolicy?: string;
    houseRules?: string[];
  };
  rawData: RawPropertyData;
}

export class DataProcessor {
  /**
   * Process Booking.com scraped data into standardized format
   * @param rawData - Raw data scraped from Booking.com
   * @returns Processed property data with standardized structure
   */
  static processBookingData(rawData: BookingComRawData): ProcessedPropertyData {
    return {
      basicInfo: {
        name: rawData.hotel_name || rawData.name || 'Unknown Property',
        location: rawData.address || rawData.location || 'Unknown Location',
        propertyType: rawData.hotel_type || rawData.property_type || 'Hotel',
        description: rawData.description || rawData.hotel_description
      },
      performance: {
        rating: parseFloat(String(rawData.rating || rawData.review_score || '0')),
        reviewCount: parseInt(String(rawData.review_count || rawData.reviews_count || '0')),
        occupancyRate: this.estimateOccupancy(rawData),
        averageDailyRate: this.extractPrice(rawData.price || rawData.rate)
      },
      amenities: this.extractAmenities(rawData.amenities || rawData.facilities || []),
      photos: this.extractPhotos(rawData.photos || rawData.images || []),
      pricing: {
        basePrice: this.extractPrice(rawData.price || rawData.base_rate),
        cleaningFee: this.extractPrice(rawData.cleaning_fee),
        additionalFees: rawData.additional_fees || {},
        discounts: rawData.discounts || {}
      },
      policies: {
        checkIn: rawData.check_in_time || rawData.checkin,
        checkOut: rawData.check_out_time || rawData.checkout,
        cancellationPolicy: rawData.cancellation_policy,
        houseRules: rawData.house_rules || []
      },
      rawData
    };
  }

  /**
   * Process Airbnb scraped data into standardized format
   * @param rawData - Raw data scraped from Airbnb
   * @returns Processed property data with standardized structure
   */
  static processAirbnbData(rawData: AirbnbRawData): ProcessedPropertyData {
    return {
      basicInfo: {
        name: rawData.name || rawData.title || 'Unknown Property',
        location: rawData.location || `${rawData.city}, ${rawData.country}` || 'Unknown Location',
        propertyType: rawData.room_type || rawData.property_type || 'Entire place',
        description: rawData.description || rawData.summary
      },
      performance: {
        rating: parseFloat(String(rawData.rating || rawData.review_scores_rating || '0')) / 20, // Airbnb uses 100-point scale
        reviewCount: parseInt(String(rawData.number_of_reviews || rawData.reviews_count || '0')),
        occupancyRate: this.estimateOccupancy(rawData),
        averageDailyRate: this.extractPrice(rawData.price)
      },
      amenities: this.extractAmenities(rawData.amenities || []),
      photos: this.extractPhotos(rawData.photos || rawData.picture_urls || []),
      pricing: {
        basePrice: this.extractPrice(rawData.price),
        cleaningFee: this.extractPrice(rawData.cleaning_fee),
        additionalFees: {
          serviceFee: this.extractPrice(rawData.service_fee),
          occupancyTax: this.extractPrice(rawData.occupancy_tax)
        },
        discounts: rawData.discounts || {}
      },
      policies: {
        checkIn: rawData.check_in_time,
        checkOut: rawData.check_out_time,
        cancellationPolicy: rawData.cancellation_policy,
        houseRules: rawData.house_rules ? rawData.house_rules.split('\n') : []
      },
      rawData
    };
  }

  /**
   * Process VRBO scraped data into standardized format
   * @param rawData - Raw data scraped from VRBO
   * @returns Processed property data with standardized structure
   */
  static processVrboData(rawData: VrboRawData): ProcessedPropertyData {
    return {
      basicInfo: {
        name: rawData.headline || rawData.name || 'Unknown Property',
        location: rawData.location || rawData.address || 'Unknown Location',
        propertyType: rawData.propertyType || 'Vacation Rental',
        description: rawData.description
      },
      performance: {
        rating: parseFloat(String(rawData.averageRating || rawData.rating || '0')),
        reviewCount: parseInt(String(rawData.reviewCount || rawData.reviews_count || '0')),
        occupancyRate: this.estimateOccupancy(rawData),
        averageDailyRate: this.extractPrice(rawData.nightlyRate || rawData.price)
      },
      amenities: this.extractAmenities(rawData.amenities || []),
      photos: this.extractPhotos(rawData.photos || []),
      pricing: {
        basePrice: this.extractPrice(rawData.nightlyRate || rawData.baseRate),
        cleaningFee: this.extractPrice(rawData.cleaningFee),
        additionalFees: rawData.fees || {},
        discounts: rawData.discounts || {}
      },
      policies: {
        checkIn: rawData.checkInTime,
        checkOut: rawData.checkOutTime,
        cancellationPolicy: rawData.cancellationPolicy,
        houseRules: rawData.houseRules || []
      },
      rawData
    };
  }

  /**
   * Extract numeric price from various string formats
   * @param priceString - Price as string, number, or undefined
   * @returns Parsed numeric price or undefined
   */
  private static extractPrice(priceString: string | number | undefined): number | undefined {
    if (!priceString) return undefined;
    
    const numStr = priceString.toString().replace(/[^\d.,]/g, '');
    const num = parseFloat(numStr.replace(',', '.'));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Extract and normalize amenities from various data formats
   * @param amenitiesData - Amenities as array or object
   * @returns Array of amenity strings
   */
  private static extractAmenities(amenitiesData: AmenitiesData): string[] {
    if (Array.isArray(amenitiesData)) {
      return amenitiesData.map(a => typeof a === 'string' ? a : a.name || a.title).filter(Boolean);
    }
    if (typeof amenitiesData === 'object') {
      return Object.keys(amenitiesData).filter(key => amenitiesData[key]);
    }
    return [];
  }

  /**
   * Extract photo URLs from various data formats
   * @param photosData - Photos as array of strings or objects
   * @returns Array of photo URL strings
   */
  private static extractPhotos(photosData: PhotosData): string[] {
    if (Array.isArray(photosData)) {
      return photosData.map(p => typeof p === 'string' ? p : p.url || p.src).filter(Boolean);
    }
    return [];
  }

  /**
   * Estimate occupancy rate based on available data
   * @param data - Raw property data with availability or review information
   * @returns Estimated occupancy rate percentage or undefined
   */
  private static estimateOccupancy(data: RawPropertyData): number | undefined {
    // Simple occupancy estimation based on available data
    if (data.occupancy_rate) return Number(data.occupancy_rate);
    if (data.availability) {
      const avail = data.availability as any;
      const available = Number(avail?.available_days || 0);
      const total = Number(avail?.total_days || 365);
      return Math.round(((total - available) / total) * 100);
    }
    
    // Fallback estimation based on reviews and rating
    const reviews = parseInt(String(data.review_count || data.number_of_reviews || '0'));
    const rating = parseFloat(String(data.rating || data.review_scores_rating || '0'));
    
    if (reviews > 50 && rating > 4.0) return 75;
    if (reviews > 20 && rating > 3.5) return 65;
    if (reviews > 10) return 55;
    return 45;
  }

  /**
   * Main processing method - routes data to appropriate platform processor
   * @param platform - Platform name (booking, airbnb, vrbo, etc.)
   * @param rawData - Raw scraped data from any platform
   * @returns Processed property data with standardized structure
   */
  static processScrapedData(platform: string, rawData: RawPropertyData): ProcessedPropertyData {
    switch (platform.toLowerCase()) {
      case 'booking':
        return this.processBookingData(rawData as BookingComRawData);
      case 'airbnb':
        return this.processAirbnbData(rawData as AirbnbRawData);
      case 'vrbo':
        return this.processVrboData(rawData as VrboRawData);
      default:
        // Generic processing for unknown platforms
        return {
          basicInfo: {
            name: String(rawData.name || rawData.title || 'Unknown Property'),
            location: String(rawData.location || rawData.address || 'Unknown Location'),
            propertyType: String(rawData.type || 'Property'),
            description: String(rawData.description || '')
          },
          performance: {
            rating: this.extractPrice(rawData.rating),
            reviewCount: parseInt(String(rawData.reviews || '0')),
            averageDailyRate: this.extractPrice(rawData.price)
          },
          amenities: this.extractAmenities(rawData.amenities || []),
          photos: this.extractPhotos(rawData.photos || []),
          pricing: {
            basePrice: this.extractPrice(rawData.price)
          },
          policies: {},
          rawData
        };
    }
  }
}
