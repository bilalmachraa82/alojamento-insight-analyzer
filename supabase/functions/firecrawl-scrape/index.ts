import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Platform-specific extraction schemas for LLM JSON extraction
const EXTRACTION_SCHEMAS: Record<string, { schema: object; prompt: string }> = {
  booking: {
    schema: {
      type: "object",
      properties: {
        property_name: { type: "string", description: "Nome completo da propriedade" },
        location: { type: "string", description: "Endereço ou localização completa" },
        rating: { type: "number", description: "Pontuação média (0-10)" },
        review_count: { type: "number", description: "Número total de avaliações" },
        price_per_night: { type: "string", description: "Preço médio por noite com moeda" },
        property_type: { type: "string", description: "Tipo de propriedade (Hotel, Apartamento, etc)" },
        amenities: { type: "array", items: { type: "string" }, description: "Lista de comodidades" },
        description: { type: "string", description: "Descrição da propriedade" },
        recent_reviews: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              rating: { type: "number" },
              date: { type: "string" },
              author: { type: "string" },
              positive: { type: "string" },
              negative: { type: "string" }
            }
          },
          description: "Últimas avaliações (máximo 20)"
        },
        images: { type: "array", items: { type: "string" }, description: "URLs das imagens principais" },
        rooms: { type: "number", description: "Número de quartos disponíveis" },
        highlights: { type: "array", items: { type: "string" }, description: "Destaques da propriedade" }
      },
      required: ["property_name", "rating", "review_count"]
    },
    prompt: "Extract all property information from this Booking.com page. Focus on getting the property name, rating, number of reviews, amenities, recent guest reviews (both positive and negative comments), and any highlights or special features mentioned."
  },
  airbnb: {
    schema: {
      type: "object",
      properties: {
        property_name: { type: "string", description: "Título do anúncio" },
        location: { type: "string", description: "Localização" },
        rating: { type: "number", description: "Pontuação média (0-5)" },
        review_count: { type: "number", description: "Número de avaliações" },
        price_per_night: { type: "string", description: "Preço por noite com moeda" },
        property_type: { type: "string", description: "Tipo de alojamento" },
        amenities: { type: "array", items: { type: "string" }, description: "Comodidades disponíveis" },
        description: { type: "string", description: "Descrição completa do anúncio" },
        host_info: {
          type: "object",
          properties: {
            name: { type: "string" },
            is_superhost: { type: "boolean" },
            response_rate: { type: "string" },
            response_time: { type: "string" }
          }
        },
        recent_reviews: {
          type: "array",
          items: {
            type: "object",
            properties: {
              text: { type: "string" },
              rating: { type: "number" },
              date: { type: "string" },
              author: { type: "string" }
            }
          },
          description: "Últimas avaliações (máximo 20)"
        },
        images: { type: "array", items: { type: "string" }, description: "URLs das fotos" },
        bedrooms: { type: "number" },
        bathrooms: { type: "number" },
        max_guests: { type: "number" },
        house_rules: { type: "array", items: { type: "string" } }
      },
      required: ["property_name", "rating", "review_count"]
    },
    prompt: "Extract all listing information from this Airbnb page. Focus on getting the listing title, rating, number of reviews, amenities, host information (especially if they're a superhost), recent guest reviews, and any house rules or special features."
  }
};

// Detect platform from URL
function detectPlatform(url: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes('booking.com')) return 'booking';
  if (lowerUrl.includes('airbnb')) return 'airbnb';
  if (lowerUrl.includes('vrbo')) return 'vrbo';
  if (lowerUrl.includes('agoda')) return 'agoda';
  return 'booking'; // Default
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, platform: providedPlatform, submissionId } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    if (!apiKey) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Firecrawl API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    // Detect platform
    const platform = providedPlatform?.toLowerCase() || detectPlatform(formattedUrl);
    const extractionConfig = EXTRACTION_SCHEMAS[platform] || EXTRACTION_SCHEMAS.booking;

    console.log('=================================');
    console.log('🔥 FIRECRAWL SCRAPING STARTED');
    console.log('=================================');
    console.log(`URL: ${formattedUrl}`);
    console.log(`Platform: ${platform}`);
    console.log(`Submission ID: ${submissionId || 'N/A'}`);

    const startTime = Date.now();

    // Call Firecrawl API with LLM JSON extraction
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: [
          'markdown',
          { 
            type: 'json', 
            schema: extractionConfig.schema,
            prompt: extractionConfig.prompt
          }
        ],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
        timeout: 60000, // 60 second timeout
      }),
    });

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Firecrawl error: ${response.status}`,
          details: errorText
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();

    console.log('=================================');
    console.log('✅ FIRECRAWL SCRAPING COMPLETED');
    console.log('=================================');
    console.log(`Processing time: ${processingTime}s`);
    console.log(`Has JSON data: ${!!data.json}`);
    console.log(`Has Markdown: ${!!data.markdown}`);
    console.log(`Property name: ${data.json?.property_name || 'N/A'}`);
    console.log(`Rating: ${data.json?.rating || 'N/A'}`);
    console.log(`Reviews: ${data.json?.review_count || 'N/A'}`);

    // Normalize data to a standard format
    const normalizedData = {
      success: true,
      platform,
      url: formattedUrl,
      processingTime,
      scrapingMethod: 'firecrawl',
      extractedAt: new Date().toISOString(),
      
      // Main property data from LLM extraction
      propertyData: data.json || {},
      
      // Raw markdown for fallback processing
      rawContent: data.markdown || '',
      
      // Metadata
      metadata: data.metadata || {},
      
      // Data quality indicators
      dataQuality: {
        hasPropertyName: !!data.json?.property_name,
        hasRating: !!data.json?.rating,
        hasReviews: !!data.json?.recent_reviews?.length,
        hasAmenities: !!data.json?.amenities?.length,
        hasDescription: !!data.json?.description,
        reviewCount: data.json?.recent_reviews?.length || 0
      }
    };

    return new Response(
      JSON.stringify(normalizedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in firecrawl-scrape:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
