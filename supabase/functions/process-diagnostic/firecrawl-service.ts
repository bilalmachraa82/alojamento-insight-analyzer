// Firecrawl scraping service for process-diagnostic

const FIRECRAWL_TIMEOUT = 90000; // 90 seconds

interface FirecrawlResult {
  success: boolean;
  propertyData?: Record<string, any>;
  rawContent?: string;
  processingTime?: number;
  error?: string;
  dataQuality?: {
    hasPropertyName: boolean;
    hasRating: boolean;
    hasReviews: boolean;
    hasAmenities: boolean;
    hasDescription: boolean;
    reviewCount: number;
  };
}

export async function scrapeWithFirecrawl(
  url: string, 
  platform: string, 
  submissionId: string
): Promise<FirecrawlResult> {
  console.log('🔥 Starting Firecrawl scraping...');
  console.log(`URL: ${url}`);
  console.log(`Platform: ${platform}`);
  
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    console.error('❌ FIRECRAWL_API_KEY not configured');
    return {
      success: false,
      error: 'FIRECRAWL_API_KEY not configured'
    };
  }

  // Get the Supabase URL to call our edge function
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  if (!supabaseUrl) {
    console.error('❌ SUPABASE_URL not configured');
    return {
      success: false,
      error: 'SUPABASE_URL not configured'
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FIRECRAWL_TIMEOUT);

    const response = await fetch(`${supabaseUrl}/functions/v1/firecrawl-scrape`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        url,
        platform,
        submissionId
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Firecrawl edge function error:', response.status, errorText);
      return {
        success: false,
        error: `Firecrawl request failed: ${response.status}`
      };
    }

    const result = await response.json();

    if (!result.success) {
      console.error('❌ Firecrawl scraping failed:', result.error);
      return {
        success: false,
        error: result.error || 'Scraping failed'
      };
    }

    console.log('✅ Firecrawl scraping successful');
    console.log(`Processing time: ${result.processingTime}s`);
    console.log(`Data quality:`, result.dataQuality);

    return {
      success: true,
      propertyData: result.propertyData,
      rawContent: result.rawContent,
      processingTime: result.processingTime,
      dataQuality: result.dataQuality
    };

  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ Firecrawl request timed out');
      return {
        success: false,
        error: 'Request timed out after 90 seconds'
      };
    }

    console.error('❌ Firecrawl service error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Direct Firecrawl API call (alternative method without edge function)
export async function scrapeWithFirecrawlDirect(
  url: string, 
  platform: string
): Promise<FirecrawlResult> {
  console.log('🔥 Starting direct Firecrawl scraping...');
  
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  if (!apiKey) {
    return {
      success: false,
      error: 'FIRECRAWL_API_KEY not configured'
    };
  }

  // Platform-specific extraction prompts
  const extractionPrompts: Record<string, string> = {
    booking: `Extract property details from this Booking.com page: property name, location, rating (0-10), review count, price per night, property type, amenities list, description, and recent guest reviews (with text, rating, date, author, positive and negative comments). Also extract highlights and any special features.`,
    airbnb: `Extract listing details from this Airbnb page: listing title, location, rating (0-5), review count, price per night, property type, amenities, description, host info (name, superhost status, response rate), recent reviews, bedrooms, bathrooms, max guests, and house rules.`
  };

  const prompt = extractionPrompts[platform] || extractionPrompts.booking;

  try {
    const startTime = Date.now();

    // Use extract format with jsonOptions for structured extraction
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: url.trim(),
        formats: ['markdown', 'extract'],
        extract: {
          prompt: prompt
        },
        onlyMainContent: true,
        waitFor: 3000,
        timeout: 60000,
      }),
    });

    const processingTime = Math.round((Date.now() - startTime) / 1000);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      return {
        success: false,
        error: `Firecrawl API error: ${response.status}`
      };
    }

    const data = await response.json();

    console.log('✅ Direct Firecrawl scraping completed');
    console.log(`Processing time: ${processingTime}s`);

    // Extract data is in data.extract or data.data.extract
    const extractedData = data.data?.extract || data.extract || {};
    const markdownContent = data.data?.markdown || data.markdown || '';

    return {
      success: true,
      propertyData: extractedData,
      rawContent: markdownContent,
      processingTime,
      dataQuality: {
        hasPropertyName: !!extractedData?.property_name || !!extractedData?.listing_title,
        hasRating: !!extractedData?.rating,
        hasReviews: !!extractedData?.recent_reviews?.length || !!extractedData?.reviews?.length,
        hasAmenities: !!extractedData?.amenities?.length,
        hasDescription: !!extractedData?.description,
        reviewCount: extractedData?.recent_reviews?.length || extractedData?.reviews?.length || extractedData?.review_count || 0
      }
    };

  } catch (error) {
    console.error('Direct Firecrawl error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
