import { describe, it, expect, beforeEach } from 'vitest';
import { DataProcessor } from './dataProcessor';
import {
  createMockBookingData,
  createMockAirbnbData,
} from '@/test/factories/propertyFactory';

describe('DataProcessor', () => {
  describe('processBookingData', () => {
    it('should process basic Booking.com data correctly', () => {
      const mockData = createMockBookingData();
      const result = DataProcessor.processBookingData(mockData);

      expect(result.basicInfo.name).toBe('Test Hotel');
      expect(result.basicInfo.location).toBe('Test Address, Lisbon');
      expect(result.basicInfo.propertyType).toBe('Hotel');
      expect(result.performance.rating).toBe(8.5);
      expect(result.performance.reviewCount).toBe(150);
    });

    it('should extract price correctly from various formats', () => {
      const data1 = createMockBookingData({ price: '€100' });
      const data2 = createMockBookingData({ price: '$125.50' });
      const data3 = createMockBookingData({ price: 150 });

      const result1 = DataProcessor.processBookingData(data1);
      const result2 = DataProcessor.processBookingData(data2);
      const result3 = DataProcessor.processBookingData(data3);

      expect(result1.pricing.basePrice).toBe(100);
      expect(result2.pricing.basePrice).toBe(125.5);
      expect(result3.pricing.basePrice).toBe(150);
    });

    it('should handle missing data gracefully', () => {
      const minimalData = {
        hotel_name: 'Minimal Hotel',
      };

      const result = DataProcessor.processBookingData(minimalData);

      expect(result.basicInfo.name).toBe('Minimal Hotel');
      expect(result.basicInfo.location).toBe('Unknown Location');
      expect(result.performance.rating).toBe(0);
      expect(result.amenities).toEqual([]);
    });

    it('should extract amenities from array format', () => {
      const data = createMockBookingData({
        amenities: ['WiFi', 'Pool', 'Parking'],
      });

      const result = DataProcessor.processBookingData(data);

      expect(result.amenities).toContain('WiFi');
      expect(result.amenities).toContain('Pool');
      expect(result.amenities).toContain('Parking');
      expect(result.amenities.length).toBe(4); // 3 from mock + 1 from default
    });

    it('should estimate occupancy based on reviews and rating', () => {
      const highPerformance = createMockBookingData({
        review_count: 100,
        rating: 9.0,
      });
      const mediumPerformance = createMockBookingData({
        review_count: 25,
        rating: 7.5,
      });
      const lowPerformance = createMockBookingData({
        review_count: 5,
        rating: 6.0,
      });

      const result1 = DataProcessor.processBookingData(highPerformance);
      const result2 = DataProcessor.processBookingData(mediumPerformance);
      const result3 = DataProcessor.processBookingData(lowPerformance);

      expect(result1.performance.occupancyRate).toBe(75);
      expect(result2.performance.occupancyRate).toBe(65);
      expect(result3.performance.occupancyRate).toBe(45);
    });
  });

  describe('processAirbnbData', () => {
    it('should process basic Airbnb data correctly', () => {
      const mockData = createMockAirbnbData();
      const result = DataProcessor.processAirbnbData(mockData);

      expect(result.basicInfo.name).toBe('Test Airbnb Property');
      expect(result.basicInfo.location).toBe('Lisbon, Portugal');
      expect(result.basicInfo.propertyType).toBe('Entire place');
      // Airbnb uses 100-point scale, should be converted to 5-point
      expect(result.performance.rating).toBe(95 / 20);
      expect(result.performance.reviewCount).toBe(75);
    });

    it('should handle cleaning fees correctly', () => {
      const data = createMockAirbnbData({ cleaning_fee: 25 });
      const result = DataProcessor.processAirbnbData(data);

      expect(result.pricing.cleaningFee).toBe(25);
    });

    it('should parse house rules from string', () => {
      const data = createMockAirbnbData({
        house_rules: 'No smoking\nNo pets\nNo parties',
      });
      const result = DataProcessor.processAirbnbData(data);

      expect(result.policies.houseRules).toEqual([
        'No smoking',
        'No pets',
        'No parties',
      ]);
    });
  });

  describe('processScrapedData', () => {
    it('should route to correct processor for Booking.com', () => {
      const data = createMockBookingData();
      const result = DataProcessor.processScrapedData('booking', data);

      expect(result.basicInfo.name).toBe('Test Hotel');
      expect(result.performance.rating).toBe(8.5);
    });

    it('should route to correct processor for Airbnb', () => {
      const data = createMockAirbnbData();
      const result = DataProcessor.processScrapedData('airbnb', data);

      expect(result.basicInfo.name).toBe('Test Airbnb Property');
      expect(result.performance.rating).toBe(4.75);
    });

    it('should handle unknown platforms with generic processing', () => {
      const data = {
        name: 'Generic Property',
        location: 'Unknown City',
        rating: 4.5,
        price: 100,
      };

      const result = DataProcessor.processScrapedData('unknown', data);

      expect(result.basicInfo.name).toBe('Generic Property');
      expect(result.basicInfo.location).toBe('Unknown City');
      expect(result.performance.rating).toBe(4.5);
    });

    it('should be case-insensitive for platform names', () => {
      const data = createMockBookingData();
      const result1 = DataProcessor.processScrapedData('BOOKING', data);
      const result2 = DataProcessor.processScrapedData('Booking', data);
      const result3 = DataProcessor.processScrapedData('booking', data);

      expect(result1.basicInfo.name).toBe(result2.basicInfo.name);
      expect(result2.basicInfo.name).toBe(result3.basicInfo.name);
    });
  });

  describe('extractPrice helper', () => {
    it('should extract prices with various currency symbols', () => {
      const testData = [
        { input: '€100', expected: 100 },
        { input: '$50.99', expected: 50.99 },
        { input: '£75', expected: 75 },
        { input: '125', expected: 125 },
        { input: 200, expected: 200 },
      ];

      testData.forEach(({ input, expected }) => {
        const data = createMockBookingData({ price: input });
        const result = DataProcessor.processBookingData(data);
        expect(result.pricing.basePrice).toBe(expected);
      });
    });

    it('should handle comma as decimal separator', () => {
      const data = createMockBookingData({ price: '€100,50' });
      const result = DataProcessor.processBookingData(data);
      expect(result.pricing.basePrice).toBe(100.5);
    });

    it('should return undefined for invalid prices', () => {
      const data = createMockBookingData({ price: undefined });
      const result = DataProcessor.processBookingData(data);
      expect(result.pricing.basePrice).toBeUndefined();
    });
  });

  describe('extractAmenities helper', () => {
    it('should handle array of strings', () => {
      const data = createMockBookingData({
        amenities: ['WiFi', 'Pool', 'Gym'],
      });
      const result = DataProcessor.processBookingData(data);

      expect(result.amenities).toContain('WiFi');
      expect(result.amenities).toContain('Pool');
      expect(result.amenities).toContain('Gym');
    });

    it('should handle array of objects with name property', () => {
      const data = createMockBookingData({
        amenities: [
          { name: 'WiFi', available: true },
          { name: 'Pool', available: true },
        ],
      });
      const result = DataProcessor.processBookingData(data);

      expect(result.amenities).toContain('WiFi');
      expect(result.amenities).toContain('Pool');
    });

    it('should handle object format', () => {
      const data = createMockBookingData({
        amenities: {
          wifi: true,
          pool: false,
          parking: true,
        },
      });
      const result = DataProcessor.processBookingData(data);

      expect(result.amenities).toContain('wifi');
      expect(result.amenities).not.toContain('pool');
      expect(result.amenities).toContain('parking');
    });

    it('should return empty array for invalid input', () => {
      const data = createMockBookingData({
        amenities: null,
      });
      const result = DataProcessor.processBookingData(data);

      expect(result.amenities).toEqual([]);
    });
  });

  describe('extractPhotos helper', () => {
    it('should extract URLs from array of strings', () => {
      const photos = ['https://example.com/1.jpg', 'https://example.com/2.jpg'];
      const data = createMockBookingData({ photos });
      const result = DataProcessor.processBookingData(data);

      expect(result.photos).toEqual(photos);
    });

    it('should extract URLs from array of objects', () => {
      const photos = [
        { url: 'https://example.com/1.jpg' },
        { src: 'https://example.com/2.jpg' },
      ];
      const data = createMockBookingData({ photos });
      const result = DataProcessor.processBookingData(data);

      expect(result.photos[0]).toBe('https://example.com/1.jpg');
      expect(result.photos[1]).toBe('https://example.com/2.jpg');
    });

    it('should return empty array for invalid input', () => {
      const data = createMockBookingData({ photos: null });
      const result = DataProcessor.processBookingData(data);

      expect(result.photos).toEqual([]);
    });
  });
});
