import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { captureMessage } from "@/config/sentry";
import { trackEvent } from "@/config/analytics";
import MetaTags from "@/components/SEO/MetaTags";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Log to console
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );

    // Track in Sentry
    captureMessage(`404 Error: ${location.pathname}`, 'warning', {
      path: location.pathname,
      search: location.search,
      referrer: document.referrer,
    });

    // Track in Google Analytics
    trackEvent('page_not_found', {
      page_path: location.pathname,
      page_search: location.search,
    });
  }, [location.pathname, location.search]);

  return (
    <>
      <MetaTags
        title="404 - Página Não Encontrada | Maria Faz"
        description="A página que você está procurando não foi encontrada."
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-3">
              <FileQuestion className="h-12 w-12 text-blue-600" />
            </div>
          </div>
          <CardTitle className="text-4xl font-bold text-gray-900">404</CardTitle>
          <CardDescription className="text-xl mt-2">
            Oops! We couldn't find this page
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-gray-600">
            <p>
              The page you're looking for doesn't exist or may have been moved.
            </p>
            <p className="text-sm mt-2 text-gray-500">
              Path: <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">{location.pathname}</code>
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={() => navigate(-1)}
              className="flex-1 flex items-center justify-center gap-2"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
            <Button
              onClick={() => navigate('/')}
              className="flex-1 flex items-center justify-center gap-2"
              variant="default"
            >
              <Home className="h-4 w-4" />
              Go Home
            </Button>
          </div>

          <div className="text-center text-sm text-gray-600">
            <p>
              If you believe this is an error, please{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                contact support
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
};

export default NotFound;
