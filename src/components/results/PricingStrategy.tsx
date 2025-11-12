
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
  currentAnalysis: string;
  seasonalPricing: SeasonalPricing[];
  specialEvents: Record<string, string> | null;
  discountPolicies: Record<string, string> | null;
  weeklyPrice: string;
  monthlyPrice: string;
  minStay: string;
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
        {/* Using season name as stable key (high/medium/low) */}
        {formattedSeasonalPricing.map((season, index) => (
          <Card key={`season-${season.season}`}>
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
              {/* Using event name as stable key */}
              {specialEvents && Object.entries(specialEvents).map(([event, price], index) => (
                <div key={`special-event-${event}`} className="flex justify-between">
                  <span>{event}</span>
                  <span className="font-medium">{String(price)}</span>
                </div>
              ))}
              {(!specialEvents || Object.keys(specialEvents).length === 0) && (
                <p className="text-sm text-muted-foreground">No special events configured.</p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <h4 className="font-medium">Discount Policies</h4>
            <div className="mt-2 space-y-2">
              {/* Using policy name as stable key */}
              {discountPolicies && Object.entries(discountPolicies).map(([policy, discount], index) => (
                <div key={`discount-policy-${policy}`} className="flex justify-between">
                  <span>{policy}</span>
                  <span className="font-medium">{String(discount)}</span>
                </div>
              ))}
              {(!discountPolicies || Object.keys(discountPolicies).length === 0) && (
                <p className="text-sm text-muted-foreground">No discount policies configured.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PricingStrategy;
