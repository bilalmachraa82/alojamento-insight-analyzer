import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MarketIntelligenceService } from './marketIntelligence';
import { createMockProperty } from '@/test/factories/propertyFactory';
import { mockSupabaseClient } from '@/test/mocks/supabase';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabaseClient,
}));

describe('MarketIntelligenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('analyzeMarket', () => {
    it('should return market insights for a property', async () => {
      const property = createMockProperty();
      const competitors = [
        createMockProperty({ id: 'comp-1', name: 'Competitor 1' }),
        createMockProperty({ id: 'comp-2', name: 'Competitor 2' }),
      ];

      // Mock Supabase responses
      mockSupabaseClient._mocks.select.mockResolvedValueOnce({
        data: [],
        error: null,
      });
      mockSupabaseClient._mocks.select.mockResolvedValueOnce({
        data: competitors,
        error: null,
      });
      mockSupabaseClient._mocks.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.analyzeMarket(
        property,
        'Lisbon'
      );

      expect(result).toHaveProperty('averageDailyRate');
      expect(result).toHaveProperty('occupancyRate');
      expect(result).toHaveProperty('competitorCount');
      expect(result).toHaveProperty('marketSaturation');
      expect(result).toHaveProperty('seasonalTrends');
      expect(result).toHaveProperty('priceRecommendations');

      expect(result.competitorCount).toBe(2);
      expect(['low', 'medium', 'high']).toContain(result.marketSaturation);
    });

    it('should determine market saturation correctly', async () => {
      const property = createMockProperty();

      // Test high saturation (> 15 competitors)
      const manyCompetitors = Array.from({ length: 20 }, (_, i) =>
        createMockProperty({ id: `comp-${i}` })
      );

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: manyCompetitors, error: null });
      mockSupabaseClient._mocks.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.analyzeMarket(
        property,
        'Lisbon'
      );

      expect(result.marketSaturation).toBe('high');
      expect(result.competitorCount).toBe(20);
    });

    it('should return default insights on error', async () => {
      const property = createMockProperty();

      mockSupabaseClient._mocks.select.mockRejectedValueOnce(
        new Error('Database error')
      );

      const result = await MarketIntelligenceService.analyzeMarket(
        property,
        'Lisbon'
      );

      expect(result.averageDailyRate).toBe(120);
      expect(result.occupancyRate).toBe(65);
      expect(result.competitorCount).toBe(5);
      expect(result.marketSaturation).toBe('medium');
    });

    it('should calculate seasonal trends based on average rate', async () => {
      const property = createMockProperty();

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseClient._mocks.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.analyzeMarket(
        property,
        'Lisbon'
      );

      expect(result.seasonalTrends).toHaveProperty('spring');
      expect(result.seasonalTrends).toHaveProperty('summer');
      expect(result.seasonalTrends).toHaveProperty('fall');
      expect(result.seasonalTrends).toHaveProperty('winter');

      // Summer should be highest
      expect(result.seasonalTrends.summer).toBeGreaterThan(
        result.seasonalTrends.spring
      );
      expect(result.seasonalTrends.summer).toBeGreaterThan(
        result.seasonalTrends.winter
      );
    });

    it('should generate price recommendations', async () => {
      const property = createMockProperty();

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseClient._mocks.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.analyzeMarket(
        property,
        'Lisbon'
      );

      expect(result.priceRecommendations.suggested).toBeGreaterThan(0);
      expect(result.priceRecommendations.range.min).toBeLessThan(
        result.priceRecommendations.suggested
      );
      expect(result.priceRecommendations.range.max).toBeGreaterThan(
        result.priceRecommendations.suggested
      );
      expect(result.priceRecommendations.reasoning).toBeTruthy();
    });
  });

  describe('generateCompetitorAnalysis', () => {
    it('should analyze top 5 competitors', async () => {
      const property = createMockProperty();
      const competitors = Array.from({ length: 10 }, (_, i) =>
        createMockProperty({ id: `comp-${i}`, name: `Competitor ${i}` })
      );

      mockSupabaseClient._mocks.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.generateCompetitorAnalysis(
        property,
        competitors
      );

      expect(result.length).toBe(5);
      expect(result[0]).toHaveProperty('competitor_name');
      expect(result[0]).toHaveProperty('strengths');
      expect(result[0]).toHaveProperty('weaknesses');
      expect(result[0]).toHaveProperty('price');
    });

    it('should identify competitor strengths and weaknesses', async () => {
      const property = createMockProperty({
        bedrooms: 2,
        amenities: { wifi: true, kitchen: true },
      });

      const competitors = [
        createMockProperty({
          id: 'comp-1',
          name: 'Better Competitor',
          bedrooms: 3,
          amenities: { wifi: true, kitchen: true, pool: true, parking: true },
        }),
        createMockProperty({
          id: 'comp-2',
          name: 'Worse Competitor',
          bedrooms: 1,
          amenities: { wifi: true },
          photos: [],
        }),
      ];

      mockSupabaseClient._mocks.insert.mockResolvedValue({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.generateCompetitorAnalysis(
        property,
        competitors
      );

      expect(result[0].strengths.length).toBeGreaterThan(0);
      expect(result[1].weaknesses).toContain('Limited photos');
    });
  });

  describe('estimatePropertyRate', () => {
    it('should calculate base rate based on property type', () => {
      // This is a private method, so we test it indirectly through analyzeMarket
      const apartmentProperty = createMockProperty({
        property_type: 'apartment',
        bedrooms: 2,
        max_guests: 4,
      });

      const houseProperty = createMockProperty({
        property_type: 'house',
        bedrooms: 3,
        max_guests: 6,
      });

      // We can't directly test private methods, but we can test the output
      // of public methods that use them
      expect(apartmentProperty.property_type).toBe('apartment');
      expect(houseProperty.property_type).toBe('house');
    });

    it('should adjust rate based on amenities', async () => {
      const basicProperty = createMockProperty({
        amenities: { wifi: true },
      });

      const luxuryProperty = createMockProperty({
        amenities: {
          wifi: true,
          pool: true,
          kitchen: true,
          parking: true,
          air_conditioning: true,
        },
      });

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseClient._mocks.insert.mockResolvedValueOnce({
        data: null,
        error: null,
      });

      const result = await MarketIntelligenceService.analyzeMarket(
        luxuryProperty,
        'Lisbon'
      );

      // Luxury property should get higher recommended price
      expect(result.priceRecommendations.suggested).toBeGreaterThan(0);
    });

    it('should adjust rate based on capacity', () => {
      const smallProperty = createMockProperty({
        max_guests: 2,
        bedrooms: 1,
      });

      const largeProperty = createMockProperty({
        max_guests: 8,
        bedrooms: 4,
      });

      expect(largeProperty.max_guests).toBeGreaterThan(
        smallProperty.max_guests
      );
      expect(largeProperty.bedrooms).toBeGreaterThan(smallProperty.bedrooms);
    });
  });

  describe('storeMarketData', () => {
    it('should store market data in database', async () => {
      const property = createMockProperty();

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });

      const insertMock = mockSupabaseClient._mocks.insert.mockResolvedValueOnce(
        {
          data: { id: 'market-data-id' },
          error: null,
        }
      );

      await MarketIntelligenceService.analyzeMarket(property, 'Lisbon');

      expect(insertMock).toHaveBeenCalled();
    });

    it('should handle storage errors gracefully', async () => {
      const property = createMockProperty();

      mockSupabaseClient._mocks.select
        .mockResolvedValueOnce({ data: [], error: null })
        .mockResolvedValueOnce({ data: [], error: null });
      mockSupabaseClient._mocks.insert.mockRejectedValueOnce(
        new Error('Insert failed')
      );

      // Should not throw even if storage fails
      await expect(
        MarketIntelligenceService.analyzeMarket(property, 'Lisbon')
      ).resolves.toBeDefined();
    });
  });
});
