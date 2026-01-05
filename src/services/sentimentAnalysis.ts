/**
 * Sentiment Analysis Service
 * Uses keyword-based analysis for client-side operations.
 * For production AI-powered sentiment analysis, use the Supabase Edge Function
 * 'analyze-sentiment' which has secure access to the Hugging Face API.
 */

// Predefined topics for extraction
export const REVIEW_TOPICS = [
  'Cleanliness',
  'Location',
  'Value',
  'Amenities',
  'Communication',
  'Check-in',
  'Accuracy',
] as const;

export type ReviewTopic = typeof REVIEW_TOPICS[number];

export interface SentimentResult {
  score: number; // -1 to +1
  label: 'positive' | 'neutral' | 'negative';
  confidence: number;
  rawScores?: {
    positive: number;
    neutral: number;
    negative: number;
  };
}

export interface TopicMention {
  topic: ReviewTopic;
  mentioned: boolean;
  sentiment?: number;
  context?: string;
}

export interface AnalyzedReview {
  id: string;
  reviewText: string;
  overallSentiment: SentimentResult;
  topics: TopicMention[];
  category: 'positive' | 'neutral' | 'negative';
  language?: string;
}

// Cache for sentiment results (in-memory)
const sentimentCache = new Map<string, SentimentResult>();

/**
 * Sleep function for rate limiting
 */
async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Analyze sentiment of a single review text using keyword-based analysis.
 * Returns a score from -1 (negative) to +1 (positive)
 *
 * Note: For AI-powered analysis, use the 'analyze-sentiment' Edge Function.
 */
export async function analyzeSentiment(reviewText: string): Promise<SentimentResult> {
  if (!reviewText || reviewText.trim().length === 0) {
    return {
      score: 0,
      label: 'neutral',
      confidence: 0,
    };
  }

  // Check cache
  const cacheKey = reviewText.substring(0, 100);
  const cached = sentimentCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Use keyword-based sentiment analysis
  const result = keywordSentimentAnalysis(reviewText);

  // Cache result
  sentimentCache.set(cacheKey, result);

  return result;
}

/**
 * Keyword-based sentiment analysis
 * Supports English and Portuguese keywords
 */
function keywordSentimentAnalysis(text: string): SentimentResult {
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

  let label: 'positive' | 'neutral' | 'negative';
  if (score > 0.2) label = 'positive';
  else if (score < -0.2) label = 'negative';
  else label = 'neutral';

  return {
    score: Math.max(-1, Math.min(1, score)),
    label,
    confidence: Math.min(total / 5, 0.7), // Lower confidence for fallback
  };
}

/**
 * Extract mentioned topics from review text
 */
export function extractTopics(reviewText: string): TopicMention[] {
  const lowerText = reviewText.toLowerCase();

  // Topic keyword mappings (EN and PT)
  const topicKeywords: Record<ReviewTopic, string[]> = {
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

    if (mentioned) {
      // Extract context (sentence containing the keyword)
      const sentences = reviewText.split(/[.!?]+/);
      const contextSentence = sentences.find(s =>
        keywords.some(k => s.toLowerCase().includes(k))
      );

      mentions.push({
        topic,
        mentioned: true,
        context: contextSentence?.trim(),
      });
    } else {
      mentions.push({
        topic,
        mentioned: false,
      });
    }
  }

  return mentions;
}

/**
 * Analyze sentiment for specific topics mentioned in review
 */
export async function extractTopicsWithSentiment(reviewText: string): Promise<TopicMention[]> {
  const topics = extractTopics(reviewText);

  // Analyze sentiment for each mentioned topic's context
  for (const topic of topics) {
    if (topic.mentioned && topic.context) {
      try {
        const sentiment = await analyzeSentiment(topic.context);
        topic.sentiment = sentiment.score;
      } catch (error) {
        console.error(`Error analyzing sentiment for topic ${topic.topic}:`, error);
      }
    }
  }

  return topics;
}

/**
 * Categorize review based on sentiment score
 */
export function categorizeReview(sentimentScore: number): 'positive' | 'neutral' | 'negative' {
  if (sentimentScore >= 0.3) return 'positive';
  if (sentimentScore <= -0.3) return 'negative';
  return 'neutral';
}

/**
 * Batch analyze multiple reviews
 */
export async function batchAnalyzeReviews(
  reviews: Array<{ id: string; text: string }>
): Promise<AnalyzedReview[]> {
  const results: AnalyzedReview[] = [];

  for (const review of reviews) {
    try {
      const overallSentiment = await analyzeSentiment(review.text);
      const topics = await extractTopicsWithSentiment(review.text);
      const category = categorizeReview(overallSentiment.score);

      results.push({
        id: review.id,
        reviewText: review.text,
        overallSentiment,
        topics,
        category,
      });

      // Add small delay between reviews to avoid rate limits
      await sleep(150);
    } catch (error) {
      console.error(`Error analyzing review ${review.id}:`, error);
      // Continue with other reviews
    }
  }

  return results;
}

/**
 * Get sentiment statistics for a collection of reviews
 */
export interface SentimentStats {
  averageScore: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  total: number;
  topicScores: Record<ReviewTopic, { score: number; count: number }>;
}

export function calculateSentimentStats(analyzedReviews: AnalyzedReview[]): SentimentStats {
  const stats: SentimentStats = {
    averageScore: 0,
    positiveCount: 0,
    neutralCount: 0,
    negativeCount: 0,
    total: analyzedReviews.length,
    topicScores: {} as Record<ReviewTopic, { score: number; count: number }>,
  };

  // Initialize topic scores
  REVIEW_TOPICS.forEach(topic => {
    stats.topicScores[topic] = { score: 0, count: 0 };
  });

  let totalScore = 0;

  analyzedReviews.forEach(review => {
    // Overall sentiment
    totalScore += review.overallSentiment.score;

    if (review.category === 'positive') stats.positiveCount++;
    else if (review.category === 'negative') stats.negativeCount++;
    else stats.neutralCount++;

    // Topic sentiment
    review.topics.forEach(topic => {
      if (topic.mentioned && topic.sentiment !== undefined) {
        stats.topicScores[topic.topic].score += topic.sentiment;
        stats.topicScores[topic.topic].count++;
      }
    });
  });

  // Calculate averages
  stats.averageScore = totalScore / Math.max(analyzedReviews.length, 1);

  // Average topic scores
  REVIEW_TOPICS.forEach(topic => {
    const topicData = stats.topicScores[topic];
    if (topicData.count > 0) {
      topicData.score = topicData.score / topicData.count;
    }
  });

  return stats;
}

/**
 * Clear sentiment cache
 */
export function clearSentimentCache(): void {
  sentimentCache.clear();
}
