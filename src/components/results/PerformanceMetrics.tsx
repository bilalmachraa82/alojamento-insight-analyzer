
import React from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";

interface MetricProps {
  label: string;
  value: number | string;
  suffix?: string;
  color?: string;
}

const Metric = ({ label, value, suffix = "", color = "text-blue-600" }: MetricProps) => (
  <div className="flex flex-col">
    <span className="text-sm text-gray-500">{label}</span>
    <span className={`text-xl font-semibold ${color}`}>
      {value}
      {suffix && <span className="text-sm ml-1">{suffix}</span>}
    </span>
  </div>
);

export interface PerformanceMetricsProps {
  occupancyRate: number | string;
  averageRating: number | string;
  reviewCount: number | string;
  responseRate: number | string;
  averageDailyRate: string;
  revenueGrowth: string;
}

const PerformanceMetrics = ({ 
  occupancyRate, 
  averageRating,
  reviewCount, 
  responseRate, 
  averageDailyRate,
  revenueGrowth 
}: PerformanceMetricsProps) => {
  
  // Sample comparative data for the chart
  const comparativeData = [
    {
      name: "Weekdays",
      current: typeof occupancyRate === 'number' ? occupancyRate - 5 : 65,
      suggested: typeof occupancyRate === 'number' ? occupancyRate + 5 : 75,
      benchmark: typeof occupancyRate === 'number' ? occupancyRate : 70,
    },
    {
      name: "Weekends",
      current: typeof occupancyRate === 'number' ? occupancyRate : 70,
      suggested: typeof occupancyRate === 'number' ? occupancyRate + 10 : 85,
      benchmark: typeof occupancyRate === 'number' ? occupancyRate + 5 : 80,
    },
    {
      name: "Holidays",
      current: typeof occupancyRate === 'number' ? occupancyRate + 5 : 75,
      suggested: typeof occupancyRate === 'number' ? occupancyRate + 15 : 90,
      benchmark: typeof occupancyRate === 'number' ? occupancyRate + 10 : 85,
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Metric 
          label="Occupancy Rate" 
          value={occupancyRate} 
          suffix="%" 
          color="text-green-600"
        />
        <Metric 
          label="Average Rating" 
          value={averageRating} 
          suffix="/5" 
          color="text-amber-600"
        />
        <Metric 
          label="Review Count" 
          value={reviewCount}
          color="text-blue-600" 
        />
        <Metric 
          label="Response Rate" 
          value={responseRate} 
          suffix="%" 
          color="text-purple-600"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Metric 
          label="Average Daily Rate" 
          value={averageDailyRate}
          color="text-brand-pink"
        />
        <Metric 
          label="Revenue Growth" 
          value={revenueGrowth}
          color="text-brand-blue" 
        />
      </div>
      
      <div className="mt-8">
        <h4 className="text-md font-medium mb-2">Price Comparison Analysis</h4>
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <BarChart data={comparativeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="current" name="Current Price" fill="#9CA3AF" />
              <Bar dataKey="suggested" name="Suggested Price" fill="#EC4899" />
              <Bar dataKey="benchmark" name="Market Benchmark" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;
