
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import AnalysisResultsViewer from '@/components/results/AnalysisResultsViewer';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AnalysisResult = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submission, setSubmission] = useState<any>(null);
  const [propertyInfo, setPropertyInfo] = useState<any>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      setLoading(true);
      try {
        if (!id) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "Missing submission ID",
          });
          setLoading(false);
          return;
        }
        
        const { data, error } = await supabase
          .from("diagnostic_submissions")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Error fetching submission:", error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Failed to fetch submission data",
          });
          setLoading(false);
          return;
        }

        if (!data) {
          toast({
            variant: "destructive",
            title: "Not Found",
            description: "Submission not found",
          });
          setLoading(false);
          return;
        }

        setSubmission(data);
        
        // Extract analysis result and property info
        if (data.analysis_result) {
          setAnalysisResult(data.analysis_result);
        } else {
          toast({
            variant: "default",
            title: "Analysis Pending",
            description: "The analysis is still being processed. Please check back later.",
          });
        }
        
        if (data.scraped_data && data.scraped_data.property_data) {
          // Extract the first property from the array if it's an array
          const propertyData = Array.isArray(data.scraped_data.property_data) 
            ? data.scraped_data.property_data[0] 
            : data.scraped_data.property_data;
          
          setPropertyInfo({
            name: propertyData.name || data.nome || "Property",
            url: data.link,
            platform: data.plataforma,
            location: propertyData.location || "Unknown location",
            rating: propertyData.rating || "No rating",
            reviewCount: propertyData.reviewCount || 0,
            amenities: propertyData.amenities || [],
            price: propertyData.price || "Unknown price",
            description: propertyData.description || "No description",
            host: propertyData.host || {},
            similarListings: propertyData.similarListings || []
          });
        } else {
          // If property data is not available, use submission data
          setPropertyInfo({
            name: data.nome || "Property",
            url: data.link,
            platform: data.plataforma,
            location: "Unknown location",
            rating: "No rating",
            reviewCount: 0,
            price: "Unknown price"
          });
        }
      } catch (error) {
        console.error("Error fetching analysis:", error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "An unexpected error occurred",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubmission();
  }, [id, toast]);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-white sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Property Analysis Results</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-600 text-lg">Loading analysis results...</p>
          </div>
        ) : (
          <AnalysisResultsViewer 
            analysis={analysisResult}
            propertyInfo={propertyInfo}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
};

export default AnalysisResult;
