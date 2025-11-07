import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const hfApiKey = Deno.env.get("HUGGINGFACE_API_KEY") || "";
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Hugging Face API configuration
const HF_API_URL = 'https://api-inference.huggingface.co/models/cardiffnlp/twitter-xlm-roberta-base-sentiment';

// Predefined topics for extraction
const REVIEW_TOPICS = [
  'Cleanliness',
  'Location',
  'Value',
  'Amenities',
  'Communication',
  'Check-in',
  'Accuracy',
] as const;

interface SentimentResult {
  score: number;
  label: string;
  confidence: number;
}

interface TopicMention {
  topic: string;
  mentioned: boolean;
  sentiment?: number;
}

/**
 * Call Hugging Face Inference API
 */
async function callHuggingFaceAPI(text: string): Promise<any> {
  const response = await fetch(HF_API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${hfApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!response.ok) {
    if (response.status === 503) {
      // Model is loading, wait and retry
      await new Promise(resolve => setTimeout(resolve, 2000));
      return callHuggingFaceAPI(text);
    }
    throw new Error(`Hugging Face API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Parse Hugging Face response to normalized sentiment score
 */
function parseHuggingFaceResponse(response: any[]): SentimentResult {
  const scores = {
    positive: 0,
    neutral: 0,
    negative: 0,
  };

  response.forEach((item: any) => {
    const label = item.label.toLowerCase();
    if (label.includes('positive')) {
      scores.positive = item.score;
    } else if (label.includes('negative')) {
      scores.negative = item.score;
    } else if (label.includes('neutral')) {
      scores.neutral = item.score;
    }
  });

  // Calculate normalized score (-1 to +1)
  const score = scores.positive - scores.negative;

  // Determine label based on highest score
  let label: string;
  const maxScore = Math.max(scores.positive, scores.neutral, scores.negative);

  if (maxScore === scores.positive) {
    label = 'positive';
  } else if (maxScore === scores.negative) {
    label = 'negative';
  } else {
    label = 'neutral';
  }

  return {
    score,
    label,
    confidence: maxScore,
  };
}

/**
 * Analyze sentiment of text
 */
async function analyzeSentiment(text: string): Promise<SentimentResult> {
  if (!text || text.trim().length === 0) {
    return { score: 0, label: 'neutral', confidence: 0 };
  }

  try {
    // Truncate long reviews for API
    const truncatedText = text.substring(0, 500);

    // Call Hugging Face API
    const response = await callHuggingFaceAPI(truncatedText);

    // Parse response
    return parseHuggingFaceResponse(response[0] || response);
  } catch (error) {
    console.error('Error analyzing sentiment:', error);

    // Fallback: simple keyword-based sentiment
    return fallbackSentimentAnalysis(text);
  }
}

/**
 * Fallback sentiment analysis using keywords
 */
function fallbackSentimentAnalysis(text: string): SentimentResult {
  const lowerText = text.toLowerCase();

  const positiveKeywords = [
    'excellent', 'amazing', 'wonderful', 'perfect', 'great', 'love', 'loved',
    'fantastic', 'beautiful', 'clean', 'comfortable', 'recommend', 'helpful',
    'excelente', 'incrível', 'maravilhoso', 'perfeito', 'ótimo', 'adorei',
    'fantástico', 'lindo', 'limpo', 'confortável', 'recomendo', 'útil',
  ];

  const negativeKeywords = [
    'terrible', 'awful', 'horrible', 'bad', 'poor', 'dirty', 'uncomfortable',
    'disappointed', 'disappointing', 'worst', 'never', 'avoid', 'issue',
    'terrível', 'horrível', 'ruim', 'sujo', 'desconfortável', 'decepcionado',
    'pior', 'nunca', 'evite', 'problema',
  ];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) positiveCount++;
  });

  negativeKeywords.forEach(keyword => {
    if (lowerText.includes(keyword)) negativeCount++;
  });

  const total = positiveCount + negativeCount;
  const score = total === 0 ? 0 : (positiveCount - negativeCount) / Math.max(total, 5);

  let label: string;
  if (score > 0.2) label = 'positive';
  else if (score < -0.2) label = 'negative';
  else label = 'neutral';

  return {
    score: Math.max(-1, Math.min(1, score)),
    label,
    confidence: Math.min(total / 5, 0.7),
  };
}

/**
 * Extract topics from review text
 */
function extractTopics(reviewText: string): TopicMention[] {
  const lowerText = reviewText.toLowerCase();

  // Topic keyword mappings (EN and PT)
  const topicKeywords: Record<string, string[]> = {
    Cleanliness: ['clean', 'dirty', 'tidy', 'spotless', 'hygiene', 'limpo', 'sujo', 'higiene'],
    Location: ['location', 'situated', 'neighborhood', 'area', 'nearby', 'localização', 'situado', 'bairro', 'perto'],
    Value: ['value', 'price', 'worth', 'expensive', 'cheap', 'afford', 'valor', 'preço', 'caro', 'barato'],
    Amenities: ['amenities', 'facilities', 'wifi', 'pool', 'parking', 'kitchen', 'comodidades', 'instalações', 'estacionamento', 'cozinha'],
    Communication: ['communication', 'host', 'responsive', 'helpful', 'replied', 'comunicação', 'anfitrião', 'responder', 'útil'],
    'Check-in': ['check-in', 'check in', 'checkin', 'arrival', 'key', 'entrada', 'chegada', 'chave'],
    Accuracy: ['accurate', 'description', 'photos', 'expected', 'as described', 'preciso', 'descrição', 'fotos', 'esperado'],
  };

  const mentions: TopicMention[] = [];

  for (const topic of REVIEW_TOPICS) {
    const keywords = topicKeywords[topic];
    const mentioned = keywords.some(keyword => lowerText.includes(keyword));

    mentions.push({
      topic,
      mentioned,
    });
  }

  return mentions;
}

/**
 * Process a batch of reviews
 */
async function processBatch(reviews: any[]): Promise<{ processed: number; errors: string[] }> {
  let processed = 0;
  const errors: string[] = [];

  for (const review of reviews) {
    try {
      if (!review.review_text || review.review_text.trim().length === 0) {
        continue; // Skip empty reviews
      }

      // Analyze overall sentiment
      const sentiment = await analyzeSentiment(review.review_text);

      // Extract topics
      const topics = extractTopics(review.review_text);

      // Process each mentioned topic
      for (const topic of topics) {
        if (!topic.mentioned) continue;

        // Extract context for topic (sentence containing keywords)
        const sentences = review.review_text.split(/[.!?]+/);
        const topicKeywords = getTopicKeywords(topic.topic);
        const contextSentence = sentences.find((s: string) =>
          topicKeywords.some((k: string) => s.toLowerCase().includes(k))
        );

        // Analyze sentiment for topic context
        let topicSentiment = sentiment.score; // Default to overall sentiment
        if (contextSentence) {
          try {
            const topicSentimentResult = await analyzeSentiment(contextSentence);
            topicSentiment = topicSentimentResult.score;
          } catch {
            // Use overall sentiment if topic sentiment analysis fails
          }
        }

        // Insert or update sentiment topic
        const { error: upsertError } = await supabase
          .from('fact_sentiment_topics')
          .upsert({
            property_id: review.property_id,
            date: review.date,
            platform: review.platform,
            topic: topic.topic,
            sentiment_score: topicSentiment,
            mention_count: 1,
          }, {
            onConflict: 'property_id,date,platform,topic',
          });

        if (upsertError) {
          console.error(`Error upserting sentiment topic for review ${review.id}:`, upsertError);
          errors.push(`Review ${review.id}: ${upsertError.message}`);
        }
      }

      processed++;

      // Rate limiting - small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 150));

    } catch (error) {
      const errorMsg = `Error processing review ${review.id}: ${error}`;
      console.error(errorMsg);
      errors.push(errorMsg);
    }
  }

  return { processed, errors };
}

/**
 * Get keywords for a topic
 */
function getTopicKeywords(topic: string): string[] {
  const topicKeywords: Record<string, string[]> = {
    Cleanliness: ['clean', 'dirty', 'tidy', 'spotless', 'hygiene', 'limpo', 'sujo', 'higiene'],
    Location: ['location', 'situated', 'neighborhood', 'area', 'nearby', 'localização', 'situado', 'bairro', 'perto'],
    Value: ['value', 'price', 'worth', 'expensive', 'cheap', 'afford', 'valor', 'preço', 'caro', 'barato'],
    Amenities: ['amenities', 'facilities', 'wifi', 'pool', 'parking', 'kitchen', 'comodidades', 'instalações', 'estacionamento', 'cozinha'],
    Communication: ['communication', 'host', 'responsive', 'helpful', 'replied', 'comunicação', 'anfitrião', 'responder', 'útil'],
    'Check-in': ['check-in', 'check in', 'checkin', 'arrival', 'key', 'entrada', 'chegada', 'chave'],
    Accuracy: ['accurate', 'description', 'photos', 'expected', 'as described', 'preciso', 'descrição', 'fotos', 'esperado'],
  };

  return topicKeywords[topic] || [];
}

/**
 * Main handler
 */
serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    console.log("Starting sentiment analysis process...");

    // Get reviews that haven't been analyzed yet or need updating
    // We'll process reviews from the last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const { data: reviews, error: fetchError } = await supabase
      .from("fact_reviews")
      .select("id, property_id, date, platform, review_text, rating")
      .not("review_text", "is", null)
      .gte("date", ninetyDaysAgo.toISOString().split('T')[0])
      .order("date", { ascending: false })
      .limit(100); // Process max 100 reviews per run

    if (fetchError) {
      console.error("Error fetching reviews:", fetchError);
      throw new Error(`Failed to fetch reviews: ${fetchError.message}`);
    }

    if (!reviews || reviews.length === 0) {
      console.log("No reviews found to process");
      return new Response(
        JSON.stringify({
          success: true,
          processed: 0,
          message: "No reviews to process",
          timestamp: new Date().toISOString(),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${reviews.length} reviews to process`);

    // Process reviews in batch
    const result = await processBatch(reviews);

    const processingTime = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        processed: result.processed,
        total: reviews.length,
        errors: result.errors.length > 0 ? result.errors : undefined,
        processing_time_ms: processingTime,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Fatal error in analyze-sentiment:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: String(error),
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
