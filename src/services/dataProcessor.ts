
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
  rawData: Record<string, any>;
}

export class DataProcessor {
  // Process Booking.com data
  static processBookingData(rawData: any): ProcessedPropertyData {
    console.log('[DataProcessor] Processing Booking.com data:', rawData);
    
    return {
      basicInfo: {
        name: rawData.hotel_name || rawData.name || 'Unknown Property',
        location: rawData.address || rawData.location || 'Unknown Location',
        propertyType: rawData.hotel_type || rawData.property_type || 'Hotel',
        description: rawData.description || rawData.hotel_description
      },
      performance: {
        rating: parseFloat(rawData.rating || rawData.review_score || '0'),
        reviewCount: parseInt(rawData.review_count || rawData.reviews_count || '0'),
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

  // Process Airbnb data
  static processAirbnbData(rawData: any): ProcessedPropertyData {
    console.log('[DataProcessor] Processing Airbnb data:', rawData);
    
    return {
      basicInfo: {
        name: rawData.name || rawData.title || 'Unknown Property',
        location: rawData.location || `${rawData.city}, ${rawData.country}` || 'Unknown Location',
        propertyType: rawData.room_type || rawData.property_type || 'Entire place',
        description: rawData.description || rawData.summary
      },
      performance: {
        rating: parseFloat(rawData.rating || rawData.review_scores_rating || '0') / 20, // Airbnb uses 100-point scale
        reviewCount: parseInt(rawData.number_of_reviews || rawData.reviews_count || '0'),
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

  // Process VRBO data
  static processVrboData(rawData: any): ProcessedPropertyData {
    console.log('[DataProcessor] Processing VRBO data:', rawData);
    
    return {
      basicInfo: {
        name: rawData.headline || rawData.name || 'Unknown Property',
        location: rawData.location || rawData.address || 'Unknown Location',
        propertyType: rawData.propertyType || 'Vacation Rental',
        description: rawData.description
      },
      performance: {
        rating: parseFloat(rawData.averageRating || rawData.rating || '0'),
        reviewCount: parseInt(rawData.reviewCount || rawData.reviews_count || '0'),
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

  // Helper methods
  private static extractPrice(priceString: string | number | undefined): number | undefined {
    if (!priceString) return undefined;
    
    const numStr = priceString.toString().replace(/[^\d.,]/g, '');
    const num = parseFloat(numStr.replace(',', '.'));
    return isNaN(num) ? undefined : num;
  }

  private static extractAmenities(amenitiesData: any): string[] {
    if (Array.isArray(amenitiesData)) {
      return amenitiesData.map(a => typeof a === 'string' ? a : a.name || a.title).filter(Boolean);
    }
    if (typeof amenitiesData === 'object') {
      return Object.keys(amenitiesData).filter(key => amenitiesData[key]);
    }
    return [];
  }

  private static extractPhotos(photosData: any): string[] {
    if (Array.isArray(photosData)) {
      return photosData.map(p => typeof p === 'string' ? p : p.url || p.src).filter(Boolean);
    }
    return [];
  }

  private static estimateOccupancy(data: any): number | undefined {
    // Simple occupancy estimation based on available data
    if (data.occupancy_rate) return data.occupancy_rate;
    if (data.availability) {
      const available = data.availability.available_days || 0;
      const total = data.availability.total_days || 365;
      return Math.round(((total - available) / total) * 100);
    }
    
    // Fallback estimation based on reviews and rating
    const reviews = parseInt(data.review_count || data.number_of_reviews || '0');
    const rating = parseFloat(data.rating || data.review_scores_rating || '0');
    
    if (reviews > 50 && rating > 4.0) return 75;
    if (reviews > 20 && rating > 3.5) return 65;
    if (reviews > 10) return 55;
    return 45;
  }

  // Main processing method
  static processScrapedData(platform: string, rawData: any): ProcessedPropertyData {
    console.log(`[DataProcessor] Processing data for platform: ${platform}`);
    
    switch (platform.toLowerCase()) {
      case 'booking':
        return this.processBookingData(rawData);
      case 'airbnb':
        return this.processAirbnbData(rawData);
      case 'vrbo':
        return this.processVrboData(rawData);
      default:
        // Generic processing for unknown platforms
        return {
          basicInfo: {
            name: rawData.name || rawData.title || 'Unknown Property',
            location: rawData.location || rawData.address || 'Unknown Location',
            propertyType: rawData.type || 'Property',
            description: rawData.description
          },
          performance: {
            rating: this.extractPrice(rawData.rating),
            reviewCount: parseInt(rawData.reviews || '0'),
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
