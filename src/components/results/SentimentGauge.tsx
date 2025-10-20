import React from 'react';

interface SentimentGaugeProps {
  score: number; // -1 to +1
  category: 'positive' | 'neutral' | 'negative';
  trend?: 'improving' | 'stable' | 'declining';
  size?: 'small' | 'medium' | 'large';
}

const SentimentGauge: React.FC<SentimentGaugeProps> = ({
  score,
  category,
  trend,
  size = 'medium',
}) => {
  // Convert -1 to +1 scale to 0-100 for display
  const displayScore = Math.round((score + 1) * 50);

  // Size configurations
  const sizeClasses = {
    small: {
      container: 'w-24 h-24',
      score: 'text-2xl',
      label: 'text-xs',
      trend: 'text-sm',
    },
    medium: {
      container: 'w-32 h-32',
      score: 'text-3xl',
      label: 'text-sm',
      trend: 'text-base',
    },
    large: {
      container: 'w-48 h-48',
      score: 'text-5xl',
      label: 'text-lg',
      trend: 'text-xl',
    },
  };

  // Color configurations
  const colorClasses = {
    positive: {
      bg: 'bg-green-100',
      border: 'border-green-500',
      text: 'text-green-600',
      glow: 'shadow-green-200',
    },
    neutral: {
      bg: 'bg-yellow-100',
      border: 'border-yellow-500',
      text: 'text-yellow-600',
      glow: 'shadow-yellow-200',
    },
    negative: {
      bg: 'bg-red-100',
      border: 'border-red-500',
      text: 'text-red-600',
      glow: 'shadow-red-200',
    },
  };

  const trendIcons = {
    improving: '↗',
    stable: '→',
    declining: '↘',
  };

  const trendColors = {
    improving: 'text-green-600',
    stable: 'text-gray-600',
    declining: 'text-red-600',
  };

  const categoryLabels = {
    positive: 'Positive',
    neutral: 'Neutral',
    negative: 'Negative',
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      <div
        className={`
          ${sizeClasses[size].container}
          ${colorClasses[category].bg}
          border-4 ${colorClasses[category].border}
          rounded-full
          flex flex-col items-center justify-center
          shadow-lg ${colorClasses[category].glow}
          transition-all duration-300
        `}
      >
        <div className={`${sizeClasses[size].score} ${colorClasses[category].text} font-bold`}>
          {displayScore}
        </div>
        <div className={`${sizeClasses[size].label} ${colorClasses[category].text}`}>
          / 100
        </div>
      </div>

      <div className={`${sizeClasses[size].label} font-medium text-gray-700`}>
        {categoryLabels[category]}
      </div>

      {trend && (
        <div className={`${sizeClasses[size].trend} ${trendColors[trend]} flex items-center space-x-1`}>
          <span>{trendIcons[trend]}</span>
          <span className="capitalize">{trend}</span>
        </div>
      )}
    </div>
  );
};

export default SentimentGauge;
