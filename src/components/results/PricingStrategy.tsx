
import React from "react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer 
} from "recharts";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface SeasonalPricing {
  season: "high" | "medium" | "low";
  months: string[];
  price: number;
  strategy: string;
}

interface SpecialEvent {
  name: string;
  date: string;
  priceStrategy: string;
}

interface PricingStrategyProps {
  basePrice: string;
  currentAnalysis: string;
  seasonalPricing: SeasonalPricing[];
  specialEvents: SpecialEvent[];
  discountPolicies: string[];
  weeklyPrice: number;
  monthlyPrice: number;
  minStay: number;
}

const PricingStrategy = ({ 
  basePrice,
  currentAnalysis,
  seasonalPricing,
  specialEvents,
  discountPolicies,
  weeklyPrice,
  monthlyPrice,
  minStay
}: PricingStrategyProps) => {
  // Create data for the chart - monthly price variations
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun", 
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const priceData = monthNames.map((month) => {
    let season = "medium";
    seasonalPricing.forEach((s) => {
      if (s.months.includes(month)) {
        season = s.season;
      }
    });
    
    let price = 0;
    seasonalPricing.forEach((s) => {
      if (s.season === season) {
        price = s.price;
      }
    });
    
    return {
      month,
      price,
      season
    };
  });

  const getSeasonColor = (season: string) => {
    switch (season) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-amber-100 text-amber-800 border-amber-200";
      case "low":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-2">Price Analysis</h3>
          <p className="text-gray-700 mb-4">{currentAnalysis}</p>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <span className="text-sm text-gray-500">Base Price Recommendation</span>
              <p className="text-xl font-bold text-brand-pink">{basePrice}</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Minimum Stay</span>
              <p className="text-xl font-bold">{minStay} nights</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Weekly Price</span>
              <p className="text-xl font-bold">{weeklyPrice}€</p>
            </div>
            <div>
              <span className="text-sm text-gray-500">Monthly Price</span>
              <p className="text-xl font-bold">{monthlyPrice}€</p>
            </div>
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-2">Seasonal Pricing Strategy</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <LineChart data={priceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#EC4899" 
                  name="Price (€)" 
                  strokeWidth={2}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium mb-3">Seasonal Details</h3>
          <div className="space-y-3">
            {seasonalPricing.map((season, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <Badge variant="outline" className={getSeasonColor(season.season)}>
                        {season.season.toUpperCase()} SEASON
                      </Badge>
                    </div>
                    <span className="font-bold text-lg">{season.price}€</span>
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
                    Months: {season.months.join(", ")}
                  </div>
                  <p className="text-sm">{season.strategy}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        
        <div>
          <h3 className="text-lg font-medium mb-3">Special Events & Discounts</h3>
          
          {specialEvents.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2">Special Events</h4>
              <ul className="space-y-2">
                {specialEvents.map((event, index) => (
                  <li key={index} className="bg-gray-50 p-3 rounded-md">
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-gray-600">Date: {event.date}</div>
                    <div className="text-sm">Strategy: {event.priceStrategy}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div>
            <h4 className="text-md font-medium mb-2">Discount Policies</h4>
            <ul className="list-disc list-inside space-y-1">
              {discountPolicies.map((policy, index) => (
                <li key={index} className="text-gray-700">{policy}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingStrategy;
