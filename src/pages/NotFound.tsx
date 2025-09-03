import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from '@/lib/logger';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    logger.error("404 Error: User attempted to access non-existent route", {
      path: location.pathname
    });
  }, [location.pathname]);

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-6">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold bg-brand-gradient bg-clip-text text-transparent">404</h1>
        <h2 className="text-2xl font-semibold">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button 
          onClick={() => window.location.href = "/"}
          className="bg-brand-gradient hover:opacity-90"
        >
          Return to Home
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
