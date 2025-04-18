
import React from "react";
import { Card, CardContent } from "@/components/ui/card";

export type SeasonalPricing = {
  season: "high" | "low" | "medium";
  months: string[];
  price: number;
  strategy: string;
};

export interface PricingStrategyProps {
  basePrice: string;
  currentAnalysis: any;
  seasonalPricing: SeasonalPricing[];
  specialEvents: any;
  discountPolicies: any;
  weeklyPrice: any;
  monthlyPrice: any;
  minStay: any;
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
  
  // Format seasonal pricing data
  const formattedSeasonalPricing = seasonalPricing.map(season => ({
    ...season,
    months: Array.isArray(season.months) ? season.months.join(", ") : season.months
  }));
  
  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-medium">Base Price</h3>
              <p className="text-2xl font-bold">{basePrice}</p>
              <p className="text-sm text-muted-foreground">{currentAnalysis}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h3 className="font-medium">Weekly/Monthly Rates</h3>
              <div className="space-y-1">
                <p>
                  <span className="font-medium">Weekly:</span> {weeklyPrice}
                </p>
                <p>
                  <span className="font-medium">Monthly:</span> {monthlyPrice}
                </p>
                <p>
                  <span className="font-medium">Minimum Stay:</span> {minStay}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-medium mt-6">Seasonal Pricing Strategy</h3>
      <div className="space-y-4">
        {formattedSeasonalPricing.map((season, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium capitalize">{season.season} Season</h4>
                  <p className="text-sm text-muted-foreground">
                    {season.months}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{typeof season.price === 'number' ? `€${season.price}` : season.price}</p>
                  <p className="text-sm text-muted-foreground">{season.strategy}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <h3 className="text-lg font-medium mt-6">Special Events & Discount Policies</h3>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium">Special Events</h4>
            <div className="mt-2 space-y-2">
              {specialEvents && Object.entries(specialEvents).map(([event, price], index) => (
                <div key={index} className="flex justify-between">
                  <span>{event}</span>
                  <span className="font-medium">{price}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium">Discount Policies</h4>
            <div className="mt-2 space-y-2">
              {discountPolicies && Object.entries(discountPolicies).map(([policy, discount], index) => (
                <div key={index} className="flex justify-between">
                  <span>{policy}</span>
                  <span className="font-medium">{discount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingStrategy;
