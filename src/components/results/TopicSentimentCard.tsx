import React from 'react';

interface TopicSentimentCardProps {
  topic: string;
  score: number; // -1 to +1
  mentionCount: number;
  trend?: 'improving' | 'stable' | 'declining';
  onClick?: () => void;
}

const TopicSentimentCard: React.FC<TopicSentimentCardProps> = ({
  topic,
  score,
  mentionCount,
  trend,
  onClick,
}) => {
  // Convert -1 to +1 scale to 0-100 for display
  const displayScore = Math.round((score + 1) * 50);

  // Determine category
  const category = score >= 0.3 ? 'positive' : score <= -0.3 ? 'negative' : 'neutral';

  // Color configurations
  const colors = {
    positive: {
      bg: 'bg-green-50 hover:bg-green-100',
      border: 'border-green-500',
      text: 'text-green-700',
      badge: 'bg-green-200 text-green-800',
    },
    neutral: {
      bg: 'bg-yellow-50 hover:bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-700',
      badge: 'bg-yellow-200 text-yellow-800',
    },
    negative: {
      bg: 'bg-red-50 hover:bg-red-100',
      border: 'border-red-500',
      text: 'text-red-700',
      badge: 'bg-red-200 text-red-800',
    },
  };

  const trendIcons = {
    improving: { icon: '↗', color: 'text-green-600' },
    stable: { icon: '→', color: 'text-gray-600' },
    declining: { icon: '↘', color: 'text-red-600' },
  };

  // Topic icon mapping
  const topicIcons: Record<string, string> = {
    'Cleanliness': '🧹',
    'Location': '📍',
    'Value': '💰',
    'Amenities': '✨',
    'Communication': '💬',
    'Check-in': '🔑',
    'Accuracy': '✓',
  };

  return (
    <div
      className={`
        ${colors[category].bg}
        border-2 ${colors[category].border}
        rounded-lg p-4
        transition-all duration-200
        ${onClick ? 'cursor-pointer shadow-md hover:shadow-lg' : 'shadow-sm'}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{topicIcons[topic] || '📊'}</span>
          <h4 className="text-lg font-semibold text-gray-800">{topic}</h4>
        </div>
        {trend && (
          <span className={`text-2xl ${trendIcons[trend].color}`}>
            {trendIcons[trend].icon}
          </span>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <div className={`text-4xl font-bold ${colors[category].text} mb-1`}>
            {displayScore}
          </div>
          <div className="text-sm text-gray-600">/ 100</div>
        </div>

        <div className="text-right">
          <div className={`${colors[category].badge} px-2 py-1 rounded-full text-xs font-medium mb-1`}>
            {category.toUpperCase()}
          </div>
          <div className="text-xs text-gray-600">
            {mentionCount} mention{mentionCount !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${
            category === 'positive' ? 'bg-green-500' :
            category === 'negative' ? 'bg-red-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${displayScore}%` }}
        />
      </div>
    </div>
  );
};

interface TopicSentimentGridProps {
  topics: Array<{
    topic: string;
    score: number;
    mentionCount: number;
    trend?: 'improving' | 'stable' | 'declining';
  }>;
  onTopicClick?: (topic: string) => void;
}

export const TopicSentimentGrid: React.FC<TopicSentimentGridProps> = ({
  topics,
  onTopicClick,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {topics.map((topic) => (
        <TopicSentimentCard
          key={topic.topic}
          topic={topic.topic}
          score={topic.score}
          mentionCount={topic.mentionCount}
          trend={topic.trend}
          onClick={onTopicClick ? () => onTopicClick(topic.topic) : undefined}
        />
      ))}
    </div>
  );
};

export default TopicSentimentCard;
