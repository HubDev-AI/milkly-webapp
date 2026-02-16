import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/AuthClient";
import { Loader2 } from "lucide-react";

interface GuestRouteProps {
  children: React.ReactNode;
}

export function GuestRoute({ children }: GuestRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="text-sm text-muted-foreground">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to the page they were trying to visit, or home
    const from = (location.state as { from?: { pathname: string } })?.from?.pathname ?? "/";
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}
