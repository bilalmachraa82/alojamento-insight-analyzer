import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Shield, RefreshCw, Download, AlertTriangle, Home } from 'lucide-react';
import {
  SystemHealthCard,
  SubmissionMetrics,
  UserMetrics,
  ErrorLog,
  PerformanceChart,
  ApiQuotaCard,
  RevenueMetrics,
} from '@/components/admin';
import { useToast } from '@/hooks/use-toast';
import { useRecentSubmissions } from '@/hooks/admin';

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { data: recentSubmissions } = useRecentSubmissions(5);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        toast({
          title: 'Access Denied',
          description: 'You must be logged in to access the admin dashboard',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      // Check if user has admin role
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !profile || !['admin', 'super_admin'].includes(profile.role)) {
        toast({
          title: 'Access Denied',
          description: 'You do not have permission to access the admin dashboard',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setIsAdmin(true);
    } catch (error: any) {
      console.error('Error checking admin access:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify admin access',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReprocessAllFailed = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      toast({
        title: 'Reprocessing...',
        description: 'Reprocessing all failed submissions. This may take a while.',
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin/reprocess-all-failed`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reprocess submissions');
      }

      toast({
        title: 'Success',
        description: result.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to reprocess submissions',
        variant: 'destructive',
      });
    }
  };

  const handleCleanupOldData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const confirmed = window.confirm(
        'Are you sure you want to cleanup old data? This action cannot be undone.'
      );

      if (!confirmed) return;

      toast({
        title: 'Cleaning up...',
        description: 'Removing old data according to retention policies.',
      });

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin/cleanup-old-data`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to cleanup data');
      }

      toast({
        title: 'Success',
        description: `${result.message}. Total records cleaned: ${result.total}`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to cleanup data',
        variant: 'destructive',
      });
    }
  };

  const handleExportData = () => {
    // Placeholder for export functionality
    toast({
      title: 'Export',
      description: 'Export functionality will be implemented in a future update',
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-[1600px]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Shield className="h-8 w-8" />
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">
              System monitoring and management console
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigate('/')}>
              <Home className="h-4 w-4 mr-2" />
              Home
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportData}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        {/* Auto-refresh indicator */}
        {autoRefresh && (
          <Alert className="mb-6">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <AlertDescription>
              Dashboard is auto-refreshing. Data updates every 30-60 seconds.
              <Button
                variant="link"
                size="sm"
                className="ml-2"
                onClick={() => setAutoRefresh(false)}
              >
                Disable
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="outline"
            className="w-full"
            onClick={handleReprocessAllFailed}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reprocess Failed Submissions
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleCleanupOldData}
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Cleanup Old Data
          </Button>
          <Button variant="outline" className="w-full" disabled>
            <Download className="h-4 w-4 mr-2" />
            Generate Report (Coming Soon)
          </Button>
        </div>

        {/* Recent Submissions Alert */}
        {recentSubmissions && recentSubmissions.some(s => s.status === 'failed') && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {recentSubmissions.filter(s => s.status === 'failed').length} recent submissions have failed.
              <Button
                variant="link"
                size="sm"
                className="ml-2"
                onClick={() => document.getElementById('submissions-tab')?.click()}
              >
                View Details
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="submissions" id="submissions-tab">Submissions</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="errors">Errors</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealthCard />
              <ApiQuotaCard />
            </div>
            <SubmissionMetrics />
            <UserMetrics />
            <RevenueMetrics />
          </TabsContent>

          <TabsContent value="submissions" className="space-y-6">
            <SubmissionMetrics />
            <PerformanceChart />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserMetrics />
          </TabsContent>

          <TabsContent value="errors" className="space-y-6">
            <ErrorLog />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SystemHealthCard />
              <ApiQuotaCard />
            </div>
            <PerformanceChart />
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Admin Dashboard v1.0.0 - Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
};

export default Admin;
