
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

// Configure Supabase client
const supabaseUrl = "https://rhrluvhbajdsnmvnpjzk.supabase.co";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

// Configure Apify
const APIFY_API_TOKEN = Deno.env.get("APIFY_API_TOKEN");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Configurações específicas para cada plataforma baseadas na documentação da Apify
const platformConfigs = {
  airbnb: {
    actorId: "apify/airbnb-scraper",
    config: {
      maxPages: 1,
      maxListings: 0,
      includeReviews: true,
      dateFrom: "",
      dateTo: "",
      currency: "EUR",
      propertyUrls: [], // Será preenchido no momento da execução
      proxyConfig: {
        useApifyProxy: true,
      },
      extendOutputFunction: `async ({ page, item, customData, request }) => {
        return item;
      }`,
    }
  },
  booking: {
    actorId: "apify/booking-scraper",
    config: {
      maxPages: 1,
      simple: false,
      includeHotelFacilities: true,
      includeRooms: true,
      includeReviews: true,
      maxReviews: 10,
      currency: "EUR",
      language: "pt-pt",
      minScore: 0,
      startUrls: [], // Será preenchido no momento da execução
      proxyConfiguration: {
        useApifyProxy: true
      }
    }
  },
  vrbo: {
    actorId: "apify/vrbo-scraper",
    config: {
      startUrls: [], // Será preenchido no momento da execução
      minPrice: 0,
      maxPrice: 0,
      currency: "EUR",
      proxyConfiguration: {
        useApifyProxy: true
      }
    }
  },
  default: {
    actorId: "apify/web-scraper",
    config: {
      startUrls: [], // Será preenchido no momento da execução
      pseudoUrls: [{ purl: "[(https|http)://.+]" }],
      linkSelector: "a",
      pageFunction: `async function pageFunction(context) {
        const { page, request, log } = context;
        const title = await page.title();
        const url = request.url;
        log.info('Page scraped', { title, url });
        return {
          title,
          url,
          html: await page.content()
        };
      }`,
      proxyConfiguration: {
        useApifyProxy: true
      }
    }
  }
};

// Function to expand shortened URLs
async function expandShortenedUrl(url) {
  try {
    console.log(`Attempting to expand shortened URL: ${url}`);
    
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "follow",
    });
    
    const expandedUrl = response.url;
    console.log(`Expanded URL: ${expandedUrl}`);
    return expandedUrl;
  } catch (error) {
    console.error(`Error expanding URL: ${error}`);
    return url; // Return original URL if expansion fails
  }
}

// Function to process Booking.com share links
async function processBookingShareUrl(url) {
  // Check if it's a Booking.com share URL
  if (url.includes("booking.com/Share-") || url.includes("booking.com/share-")) {
    try {
      // First try to expand the URL to get the actual property URL
      const expandedUrl = await expandShortenedUrl(url);
      
      // If expansion was successful and URL changed
      if (expandedUrl !== url) {
        console.log(`Successfully expanded Booking.com share URL to: ${expandedUrl}`);
        return expandedUrl;
      }
      
      // If direct expansion didn't work, we may need to simulate a browser visit
      console.log("Direct URL expansion didn't work, may need manual review");
      return null;
    } catch (error) {
      console.error(`Error processing Booking share URL: ${error}`);
      return null;
    }
  }
  
  return url; // Not a share URL, return as is
}

// Utilitário para normalizar URLs de propriedades
async function normalizePropertyUrl(url, platform) {
  // Remove parâmetros de query, exceto os necessários
  try {
    // Special handling for Booking.com share links
    if (platform === "booking") {
      const processedUrl = await processBookingShareUrl(url);
      if (!processedUrl) {
        console.log("Could not process Booking.com share URL, needs manual review");
        return null;
      }
      url = processedUrl;
    }
    
    const urlObj = new URL(url);
    
    // Limpa parâmetros específicos por plataforma
    switch (platform) {
      case "airbnb":
        // Manter apenas parâmetros essenciais para Airbnb
        const essentialAirbnbParams = ["check_in", "check_out", "guests"];
        for (const param of [...urlObj.searchParams.keys()]) {
          if (!essentialAirbnbParams.includes(param)) {
            urlObj.searchParams.delete(param);
          }
        }
        break;
      case "booking":
        // Manter apenas parâmetros essenciais para Booking
        const essentialBookingParams = ["checkin", "checkout", "group_adults"];
        for (const param of [...urlObj.searchParams.keys()]) {
          if (!essentialBookingParams.includes(param)) {
            urlObj.searchParams.delete(param);
          }
        }
        break;
      default:
        // Para outras plataformas, remover todos os parâmetros
        urlObj.search = "";
    }
    
    return urlObj.toString();
  } catch (e) {
    console.error("Error normalizing URL:", e);
    return null;
  }
}

// Prepara o input específico para cada plataforma
async function prepareActorInput(url, platform) {
  const normalizedUrl = await normalizePropertyUrl(url, platform);
  
  if (!normalizedUrl) {
    console.log(`Failed to normalize URL for ${platform}: ${url}`);
    return null;
  }
  
  console.log(`Normalized URL for ${platform}: ${normalizedUrl}`);
  
  const config = { ...platformConfigs[platform]?.config } || { ...platformConfigs.default.config };
  
  switch (platform) {
    case "airbnb":
      config.propertyUrls = [normalizedUrl];
      break;
    case "booking":
      config.startUrls = [{ url: normalizedUrl }];
      break;
    case "vrbo":
      config.startUrls = [{ url: normalizedUrl }];
      break;
    default:
      config.startUrls = [{ url: normalizedUrl }];
  }
  
  return config;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const { id } = await req.json();
    
    if (!id) {
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing diagnostic submission: ${id}`);

    // Fetch the submission from Supabase
    const { data: submission, error: fetchError } = await supabase
      .from("diagnostic_submissions")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !submission) {
      console.error("Error fetching submission:", fetchError);
      return new Response(
        JSON.stringify({ error: "Failed to fetch submission", details: fetchError }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update status to "processing"
    await supabase
      .from("diagnostic_submissions")
      .update({ status: "processing" })
      .eq("id", id);

    // Determine actor ID based on platform
    const platform = submission.plataforma.toLowerCase();
    const platformConfig = platformConfigs[platform] || platformConfigs.default;
    const actorId = platformConfig.actorId;
    
    console.log(`Using actor ${actorId} for platform ${platform}`);

    if (!APIFY_API_TOKEN) {
      console.error("Missing APIFY_API_TOKEN");
      return new Response(
        JSON.stringify({ error: "Missing API token configuration" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const startUrl = submission.link;
    console.log(`Processing URL: ${startUrl}`);
    
    // Preparar o input específico para o ator da plataforma
    const actorInput = await prepareActorInput(startUrl, platform);
    
    // If URL processing failed, mark for manual review
    if (!actorInput) {
      console.log(`URL processing failed for ${platform}: ${startUrl}, marking for manual review`);
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "pending_manual_review",
          scraped_data: {
            error: "Could not process the URL format. It may be a shortened or share URL that needs manual expansion.",
            error_at: new Date().toISOString(),
            reason: "url_processing_error",
            url: startUrl,
            platform: platform,
            actor_id: actorId
          }
        })
        .eq("id", id);
        
      return new Response(
        JSON.stringify({
          success: false,
          message: "We need to process this URL manually. Our team will review your submission soon.",
          details: "URL format not compatible with automatic processing"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    console.log(`Actor input prepared:`, JSON.stringify(actorInput, null, 2));
    
    // Executar o ator diretamente
    try {
      const directActorUrl = `https://api.apify.com/v2/acts/${actorId}/runs?token=${APIFY_API_TOKEN}`;
      
      console.log(`Making direct actor request to: ${directActorUrl}`);
      
      const directRunResponse = await fetch(directActorUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(actorInput),
      });
      
      // Se a execução direta do ator falhar, trate o erro
      if (!directRunResponse.ok) {
        const errorText = await directRunResponse.text();
        console.error(`Direct actor run failed: ${errorText}`);
        
        let errorDetails = "Error connecting to data provider";
        try {
          // Tentar analisar o erro para obter mais detalhes
          const errorJson = JSON.parse(errorText);
          errorDetails = errorJson.error?.message || errorJson.error || errorText;
        } catch (e) {
          errorDetails = errorText;
        }
        
        // Marcar para revisão manual com detalhes
        await supabase
          .from("diagnostic_submissions")
          .update({
            status: "pending_manual_review",
            scraped_data: {
              error: errorDetails,
              error_at: new Date().toISOString(),
              reason: "api_error",
              url: startUrl,
              platform: platform,
              actor_id: actorId,
              actor_input: actorInput
            }
          })
          .eq("id", id);
          
        return new Response(
          JSON.stringify({
            success: false,
            message: "We encountered an error accessing the property data, but we've noted your submission for manual review.",
            details: errorDetails
          }),
          { 
            status: 200, 
            headers: { ...corsHeaders, "Content-Type": "application/json" } 
          }
        );
      }
      
      // Se bem-sucedido, processar os dados da execução
      const runData = await directRunResponse.json();
      const runId = runData.data.id;
      
      console.log(`Successfully started Apify direct actor run with ID: ${runId}`);
      
      // Armazenar o ID de execução do Apify no banco de dados
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "scraping",
          scraped_data: {
            apify_run_id: runId,
            started_at: new Date().toISOString(),
            url: startUrl,
            platform: platform,
            actor_id: actorId,
            actor_input: actorInput
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Diagnostic processing started with direct actor run",
          runId
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    } catch (apiError) {
      // Capturar quaisquer erros inesperados durante as chamadas de API
      console.error("Apify API error:", apiError);
      
      // Atualizar com informações detalhadas do erro
      await supabase
        .from("diagnostic_submissions")
        .update({
          status: "pending_manual_review",
          scraped_data: {
            error: String(apiError),
            error_at: new Date().toISOString(),
            reason: "unexpected_error",
            url: startUrl,
            platform: platform,
            actor_id: actorId,
            actor_input: actorInput
          }
        })
        .eq("id", id);
      
      return new Response(
        JSON.stringify({ 
          success: false,
          message: "We encountered an unexpected error, but we've noted your submission for manual review.",
          error: String(apiError)
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
  } catch (error) {
    console.error("Error processing diagnostic:", error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: String(error),
        message: "An error occurred, but your submission was saved" 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
