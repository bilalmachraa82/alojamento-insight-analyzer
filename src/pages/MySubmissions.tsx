import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, ArrowLeft, ExternalLink, Download, Clock, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Session } from "@supabase/supabase-js";
import { formatDistanceToNow } from "date-fns";
import MariaFazLogo from "@/components/MariaFazLogo";

interface Submission {
  id: string;
  name: string;
  email: string;
  property_url: string;
  platform: string;
  status: string;
  created_at: string;
  premium_report_url: string | null;
  report_generated_at: string | null;
}

const MySubmissions = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (session?.user) {
      fetchSubmissions();
    }
  }, [session]);

  const fetchSubmissions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("diagnostic_submissions")
        .select("*")
        .eq("email", session?.user?.email)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setSubmissions(data || []);
    } catch (error: any) {
      console.error("Error fetching submissions:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load your submissions. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      pending: { label: "Pending", variant: "outline", icon: Clock },
      processing: { label: "Processing", variant: "secondary", icon: Clock },
      scraping: { label: "Collecting Data", variant: "secondary", icon: Clock },
      analyzing: { label: "Analyzing", variant: "secondary", icon: Clock },
      completed: { label: "Completed", variant: "default", icon: CheckCircle2 },
      failed: { label: "Failed", variant: "destructive", icon: XCircle },
      pending_manual_review: { label: "Under Review", variant: "outline", icon: AlertCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const downloadReport = async (reportUrl: string) => {
    try {
      // Extract file path from URL
      const urlParts = reportUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Create signed URL
      const { data, error } = await supabase.storage
        .from('premium-reports')
        .createSignedUrl(fileName, 3600); // 1 hour expiry

      if (error) throw error;

      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (error: any) {
      console.error("Error downloading report:", error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download the report. Please try again or contact support.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream via-brand-beige to-brand-pink/20">
        <Loader2 className="h-8 w-8 animate-spin text-brand-pink" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-cream via-brand-beige to-brand-pink/20">
      <header className="w-full py-4 px-6 md:px-8 flex justify-between items-center shadow-sm bg-white sticky top-0 z-10">
        <MariaFazLogo />
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/")}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>
      </header>

      <main className="w-full max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-brand-black mb-2">My Submissions</h1>
          <p className="text-gray-600">
            Track the status of your property diagnostics and download your reports.
          </p>
        </div>

        {submissions.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <p className="text-gray-600 mb-4">You haven't submitted any diagnostics yet.</p>
              <Link to="/">
                <Button className="bg-brand-pink hover:bg-brand-pink/90 text-brand-black">
                  Submit Your First Diagnostic
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <Card key={submission.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{submission.name}</CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        <Badge variant="outline" className="capitalize">
                          {submission.platform}
                        </Badge>
                        {getStatusBadge(submission.status)}
                      </CardDescription>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <a
                      href={submission.property_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-brand-blue hover:underline truncate"
                    >
                      {submission.property_url}
                    </a>
                  </div>

                  {submission.status === 'completed' && submission.premium_report_url && (
                    <div className="pt-2 border-t">
                      <Button
                        onClick={() => downloadReport(submission.premium_report_url!)}
                        className="w-full sm:w-auto bg-brand-pink hover:bg-brand-pink/90 text-brand-black"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download Premium Report
                      </Button>
                      {submission.report_generated_at && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Report generated {formatDistanceToNow(new Date(submission.report_generated_at), { addSuffix: true })}
                        </p>
                      )}
                    </div>
                  )}

                  {submission.status === 'failed' && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-destructive">
                        Processing failed. Our team will review your submission manually.
                      </p>
                    </div>
                  )}

                  {submission.status === 'pending_manual_review' && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        Your submission requires manual review. Our team will process it shortly.
                      </p>
                    </div>
                  )}

                  {['pending', 'processing', 'scraping', 'analyzing'].includes(submission.status) && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Your diagnostic is being processed. This usually takes 3-5 minutes.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MySubmissions;
