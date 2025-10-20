/**
 * Hook: useSentimentAnalysis
 * Fetches and analyzes sentiment data from fact_sentiment_topics table
 *
 * Provides:
 * - Overall sentiment trends
 * - Topic-specific sentiment scores
 * - Sentiment distribution (positive/neutral/negative)
 * - Sentiment insights and recommendations
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DateRange {
  start: string; // ISO date string YYYY-MM-DD
  end: string;
}

export interface SentimentTopic {
  property_id: string;
  date: string;
  platform: string;
  topic: string;
  sentiment_score: number; // -1 to +1
  mention_count: number;
  created_at: string;
  updated_at: string;
}

export interface SentimentSummary {
  overall_score: number;
  overall_category: 'positive' | 'neutral' | 'negative';
  total_mentions: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
  topic_scores: Record<string, {
    score: number;
    mentions: number;
    category: 'positive' | 'neutral' | 'negative';
  }>;
}

export interface SentimentTrend {
  date: string;
  score: number;
  positive_count: number;
  neutral_count: number;
  negative_count: number;
}

interface UseSentimentAnalysisOptions {
  propertyId: string;
  dateRange: DateRange;
  enabled?: boolean;
}

/**
 * Categorize sentiment score
 */
function categorizeSentiment(score: number): 'positive' | 'neutral' | 'negative' {
  if (score >= 0.3) return 'positive';
  if (score <= -0.3) return 'negative';
  return 'neutral';
}

/**
 * Hook: useSentimentTopics
 * Fetch raw sentiment topic data
 */
export const useSentimentTopics = (
  { propertyId, dateRange, enabled = true }: UseSentimentAnalysisOptions,
  queryOptions?: Omit<UseQueryOptions<SentimentTopic[], Error>, 'queryKey' | 'queryFn'>
) => {
  return useQuery<SentimentTopic[], Error>({
    queryKey: ['sentiment-topics', propertyId, dateRange.start, dateRange.end],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fact_sentiment_topics')
        .select('*')
        .eq('property_id', propertyId)
        .gte('date', dateRange.start)
        .lte('date', dateRange.end)
        .order('date', { ascending: false });

      if (error) {
        console.error('[useSentimentTopics] Error fetching data:', error);
        throw error;
      }

      return data as SentimentTopic[];
    },
    enabled: enabled && !!propertyId && !!dateRange.start && !!dateRange.end,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...queryOptions,
  });
};

/**
 * Hook: useSentimentSummary
 * Calculate overall sentiment summary
 */
export const useSentimentSummary = (
  { propertyId, dateRange, enabled = true }: UseSentimentAnalysisOptions
): { data: SentimentSummary | undefined; isLoading: boolean; error: Error | null } => {
  const { data: topics, isLoading, error } = useSentimentTopics({ propertyId, dateRange, enabled });

  if (!topics || topics.length === 0) {
    return { data: undefined, isLoading, error };
  }

  // Calculate overall sentiment
  const totalScore = topics.reduce((sum, topic) => sum + topic.sentiment_score, 0);
  const totalMentions = topics.reduce((sum, topic) => sum + topic.mention_count, 0);
  const overall_score = totalScore / topics.length;
  const overall_category = categorizeSentiment(overall_score);

  // Count sentiment categories
  let positive_count = 0;
  let neutral_count = 0;
  let negative_count = 0;

  topics.forEach(topic => {
    const category = categorizeSentiment(topic.sentiment_score);
    if (category === 'positive') positive_count += topic.mention_count;
    else if (category === 'negative') negative_count += topic.mention_count;
    else neutral_count += topic.mention_count;
  });

  // Calculate topic-specific scores
  const topicScores: Record<string, { score: number; mentions: number; count: number }> = {};

  topics.forEach(topic => {
    if (!topicScores[topic.topic]) {
      topicScores[topic.topic] = { score: 0, mentions: 0, count: 0 };
    }
    topicScores[topic.topic].score += topic.sentiment_score;
    topicScores[topic.topic].mentions += topic.mention_count;
    topicScores[topic.topic].count += 1;
  });

  // Average topic scores
  const topic_scores: Record<string, {
    score: number;
    mentions: number;
    category: 'positive' | 'neutral' | 'negative';
  }> = {};

  Object.keys(topicScores).forEach(topic => {
    const avgScore = topicScores[topic].score / topicScores[topic].count;
    topic_scores[topic] = {
      score: avgScore,
      mentions: topicScores[topic].mentions,
      category: categorizeSentiment(avgScore),
    };
  });

  const summary: SentimentSummary = {
    overall_score,
    overall_category,
    total_mentions: totalMentions,
    positive_count,
    neutral_count,
    negative_count,
    topic_scores,
  };

  return { data: summary, isLoading, error };
};

/**
 * Hook: useSentimentTrend
 * Get sentiment trend over time
 */
export const useSentimentTrend = (
  { propertyId, dateRange, enabled = true }: UseSentimentAnalysisOptions
): { data: SentimentTrend[] | undefined; isLoading: boolean; error: Error | null } => {
  const { data: topics, isLoading, error } = useSentimentTopics({ propertyId, dateRange, enabled });

  if (!topics || topics.length === 0) {
    return { data: undefined, isLoading, error };
  }

  // Group by date
  const dateGroups: Record<string, SentimentTopic[]> = {};

  topics.forEach(topic => {
    if (!dateGroups[topic.date]) {
      dateGroups[topic.date] = [];
    }
    dateGroups[topic.date].push(topic);
  });

  // Calculate trend for each date
  const trend: SentimentTrend[] = Object.keys(dateGroups)
    .sort()
    .map(date => {
      const dayTopics = dateGroups[date];
      const avgScore = dayTopics.reduce((sum, t) => sum + t.sentiment_score, 0) / dayTopics.length;

      let positive_count = 0;
      let neutral_count = 0;
      let negative_count = 0;

      dayTopics.forEach(topic => {
        const category = categorizeSentiment(topic.sentiment_score);
        if (category === 'positive') positive_count += topic.mention_count;
        else if (category === 'negative') negative_count += topic.mention_count;
        else neutral_count += topic.mention_count;
      });

      return {
        date,
        score: avgScore,
        positive_count,
        neutral_count,
        negative_count,
      };
    });

  return { data: trend, isLoading, error };
};

/**
 * Hook: useSentimentComparison
 * Compare sentiment between two periods
 */
export const useSentimentComparison = (
  propertyId: string,
  currentPeriod: DateRange,
  previousPeriod: DateRange
) => {
  const current = useSentimentSummary({ propertyId, dateRange: currentPeriod });
  const previous = useSentimentSummary({ propertyId, dateRange: previousPeriod });

  if (!current.data || !previous.data) {
    return {
      data: undefined,
      isLoading: current.isLoading || previous.isLoading,
      error: current.error || previous.error,
    };
  }

  const scoreDiff = current.data.overall_score - previous.data.overall_score;
  const trend: 'improving' | 'stable' | 'declining' =
    scoreDiff > 0.1 ? 'improving' :
    scoreDiff < -0.1 ? 'declining' : 'stable';

  const comparison = {
    current_score: current.data.overall_score,
    previous_score: previous.data.overall_score,
    score_change: scoreDiff,
    trend,
    current_positive: current.data.positive_count,
    previous_positive: previous.data.positive_count,
    current_negative: current.data.negative_count,
    previous_negative: previous.data.negative_count,
  };

  return {
    data: comparison,
    isLoading: false,
    error: null,
  };
};

/**
 * Hook: useTopicTrends
 * Get trend for each topic
 */
export const useTopicTrends = (
  { propertyId, dateRange, enabled = true }: UseSentimentAnalysisOptions,
  previousPeriod?: DateRange
) => {
  const current = useSentimentSummary({ propertyId, dateRange, enabled });
  const previous = previousPeriod
    ? useSentimentSummary({ propertyId, dateRange: previousPeriod, enabled })
    : { data: undefined, isLoading: false, error: null };

  if (!current.data) {
    return {
      data: undefined,
      isLoading: current.isLoading,
      error: current.error,
    };
  }

  const topicTrends = Object.keys(current.data.topic_scores).map(topic => {
    const currentScore = current.data!.topic_scores[topic];
    const previousScore = previous.data?.topic_scores[topic];

    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    if (previousScore) {
      const diff = currentScore.score - previousScore.score;
      if (diff > 0.1) trend = 'improving';
      else if (diff < -0.1) trend = 'declining';
    }

    return {
      topic,
      score: currentScore.score,
      mentions: currentScore.mentions,
      category: currentScore.category,
      trend,
      previous_score: previousScore?.score,
    };
  });

  // Sort by score (best to worst)
  topicTrends.sort((a, b) => b.score - a.score);

  return {
    data: topicTrends,
    isLoading: current.isLoading || previous.isLoading,
    error: current.error || previous.error,
  };
};

/**
 * Hook: useSentimentInsights
 * Generate actionable insights from sentiment data
 */
export const useSentimentInsights = (
  { propertyId, dateRange, enabled = true }: UseSentimentAnalysisOptions
) => {
  const summary = useSentimentSummary({ propertyId, dateRange, enabled });

  if (!summary.data) {
    return {
      data: undefined,
      isLoading: summary.isLoading,
      error: summary.error,
    };
  }

  // Identify top positive aspects
  const topPositive = Object.entries(summary.data.topic_scores)
    .filter(([_, data]) => data.category === 'positive')
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, 3)
    .map(([topic, _]) => topic);

  // Identify areas for improvement
  const areasForImprovement = Object.entries(summary.data.topic_scores)
    .filter(([_, data]) => data.category === 'negative' || (data.category === 'neutral' && data.score < 0))
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, 3)
    .map(([topic, _]) => topic);

  // Generate action items
  const actionItems: string[] = [];

  areasForImprovement.forEach(topic => {
    const topicData = summary.data!.topic_scores[topic];
    if (topic === 'Cleanliness') {
      actionItems.push('Implement stricter cleaning protocols and quality checks');
    } else if (topic === 'Communication') {
      actionItems.push('Improve response time and communication templates for guests');
    } else if (topic === 'Value') {
      actionItems.push('Review pricing strategy and add value-added amenities');
    } else if (topic === 'Location') {
      actionItems.push('Provide better directions and local area information');
    } else if (topic === 'Amenities') {
      actionItems.push('Upgrade or add amenities based on guest feedback');
    } else if (topic === 'Check-in') {
      actionItems.push('Streamline check-in process and provide clearer instructions');
    } else if (topic === 'Accuracy') {
      actionItems.push('Update property description and photos to match reality');
    }
  });

  // Add general action if overall sentiment is low
  if (summary.data.overall_category === 'negative') {
    actionItems.push('Conduct comprehensive property audit and address critical issues immediately');
  }

  const insights = {
    top_positive_aspects: topPositive,
    areas_for_improvement: areasForImprovement,
    action_items: actionItems,
    overall_health: summary.data.overall_category,
    requires_immediate_attention: summary.data.overall_score < -0.3,
  };

  return {
    data: insights,
    isLoading: false,
    error: null,
  };
};
