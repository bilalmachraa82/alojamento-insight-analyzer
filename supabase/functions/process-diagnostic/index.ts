import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";
import { scrapeWithFirecrawlDirect } from "./firecrawl-service.ts";
import { getSubmission, updateSubmissionStatus } from "./db-service.ts";

// Retry configuration
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_DELAY_MS = 5000;

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { id } = await req.json();
    
    if (!id) {
      console.error("Missing submission ID");
      return new Response(
        JSON.stringify({ error: "Missing submission ID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("=================================");
    console.log(`📋 ETAPA 1: INICIAR SCRAPING`);
    console.log(`Processing diagnostic submission: ${id}`);
    console.log("=================================");

    // Fetch the submission
    const submission = await getSubmission(id);
    console.log(`✅ Submission encontrada:`, {
      id,
      platform: submission.platform,
      url: submission.property_url,
      email: submission.email,
      status_atual: submission.status
    });
    
    // Update status to "processing"
    await updateSubmissionStatus(id, "processing");
    console.log(`📝 Status atualizado para: processing`);

    // Trim any whitespace from the URL
    const startUrl = submission.property_url.trim();
    console.log(`Processing URL: ${startUrl}`);
    
    // Check if the URL is a Booking.com Share URL
    if (startUrl.includes("booking.com/Share-") || startUrl.includes("booking.com/share-")) {
      console.log("Detected Booking.com share URL. These URLs are not recommended.");
      
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: "Booking.com share URL detected",
        error_at: new Date().toISOString(),
        reason: "incompatible_url",
        url: startUrl,
        message: "Os URLs de compartilhamento do Booking.com não são suportados. Por favor, use o URL completo da propriedade."
      });
        
      return new Response(
        JSON.stringify({
          success: false,
          message: "Precisamos processar sua submissão manualmente. Nossa equipe irá analisá-la em breve.",
          details: "URLs de compartilhamento do Booking.com não são suportados. Por favor, use o URL completo da propriedade na próxima vez."
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    // Start Firecrawl scraping with retry logic
    console.log("=================================");
    console.log("🔥 ETAPA 2: INICIAR FIRECRAWL SCRAPER");
    console.log("=================================");
    const platform = submission.platform.toLowerCase().replace('.com', '');
    console.log(`Platform: ${platform}`);
    console.log(`Max Attempts: ${MAX_RETRY_ATTEMPTS}`);
    
    let scrapeResult;
    let lastError;
    
    for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
      console.log(`Scraping attempt ${attempt}/${MAX_RETRY_ATTEMPTS}`);
      
      try {
        scrapeResult = await scrapeWithFirecrawlDirect(startUrl, platform);
        
        if (scrapeResult.success) {
          console.log(`✅ Scraping succeeded on attempt ${attempt}`);
          break;
        }
        
        lastError = scrapeResult.error;
        console.warn(`Attempt ${attempt} failed:`, lastError);
        
        // Update status to retry if not last attempt
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await updateSubmissionStatus(id, "scraping_retry", {
            retry_attempt: attempt,
            last_error: lastError,
            next_retry_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
            scraping_method: "firecrawl"
          });
          
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      } catch (error) {
        lastError = String(error);
        console.error(`Attempt ${attempt} error:`, error);
        
        if (attempt < MAX_RETRY_ATTEMPTS) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
      }
    }
    
    if (!scrapeResult || !scrapeResult.success) {
      console.log("=================================");
      console.error(`❌ FALHA NO SCRAPING`);
      console.error(`Todas as ${MAX_RETRY_ATTEMPTS} tentativas falharam`);
      console.error(`Último erro:`, lastError);
      console.log("=================================");
      
      await updateSubmissionStatus(id, "pending_manual_review", {
        error: lastError,
        error_at: new Date().toISOString(),
        retry_count: MAX_RETRY_ATTEMPTS,
        reason: "firecrawl_failure",
        scraping_method: "firecrawl"
      });
      
      return new Response(
        JSON.stringify({
          success: false,
          message: "Precisamos processar sua submissão manualmente. Nossa equipe irá analisá-la em breve.",
          details: "Erro ao acessar dados da propriedade"
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Scraping succeeded - save property data and trigger analysis
    console.log("=================================");
    console.log("✅ DADOS FIRECRAWL COLETADOS");
    console.log("=================================");
    console.log(`Processing time: ${scrapeResult.processingTime}s`);
    console.log(`Data quality:`, scrapeResult.dataQuality);
    console.log(`Property name: ${scrapeResult.propertyData?.property_name || 'N/A'}`);
    console.log(`Rating: ${scrapeResult.propertyData?.rating || 'N/A'}`);
    console.log(`Reviews count: ${scrapeResult.propertyData?.review_count || 'N/A'}`);
    
    // Update submission with property data
    await updateSubmissionStatus(id, "analyzing", {
      property_data: scrapeResult.propertyData,
      scraping_method: "firecrawl",
      scraped_at: new Date().toISOString(),
      url: startUrl,
      platform: platform,
      processing_time_secs: scrapeResult.processingTime || 0,
      data_quality: scrapeResult.dataQuality
    });
    console.log("📝 Status atualizado para: analyzing");

    // Trigger Claude analysis directly (since Firecrawl is synchronous)
    console.log("=================================");
    console.log("🤖 ETAPA 3: INICIAR ANÁLISE CLAUDE");
    console.log("=================================");
    
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
      
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('Missing Supabase configuration');
      }

      // Call analyze-property-claude with the scraped data
      const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-property-claude`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`
        },
        body: JSON.stringify({
          id: id,  // analyzer expects 'id', not 'submissionId'
          propertyData: scrapeResult.propertyData,
          rawContent: scrapeResult.rawContent,
          platform: platform
        })
      });

      if (!analysisResponse.ok) {
        const errorText = await analysisResponse.text();
        console.error('❌ Claude analysis request failed:', analysisResponse.status, errorText);
        // Don't fail the whole process - analysis can be retried
      } else {
        const analysisResult = await analysisResponse.json();
        console.log('✅ Claude analysis triggered successfully');
        console.log('Analysis result:', analysisResult.success ? 'success' : 'pending');
      }
    } catch (analysisError) {
      console.error('❌ Error triggering Claude analysis:', analysisError);
      // Don't fail - the submission data is saved and analysis can be retried
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Property data collected and analysis started",
        scrapingMethod: "firecrawl",
        processingTime: scrapeResult.processingTime,
        dataQuality: scrapeResult.dataQuality
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
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
