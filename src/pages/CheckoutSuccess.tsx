import { useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { MilklyLogo } from "@/components/MilklyLogo";
import { Button } from "@/components/ui/Button";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { queryKeys } from "@/lib/QueryKeys";

interface VerifyResult {
  paymentStatus: string;
  subscriptionActive: boolean;
}

export default function CheckoutSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sessionId = searchParams.get("session_id");

  const { data, isLoading, error } = useQuery({
    queryKey: ["verify-checkout", sessionId],
    queryFn: () =>
      api.get<VerifyResult>(
        `/subscription/verify-checkout?session_id=${sessionId}`,
      ),
    enabled: !!sessionId,
    retry: 3,
    retryDelay: 2000,
  });

  useEffect(() => {
    if (!sessionId) {
      navigate("/");
      return;
    }
  }, [sessionId, navigate]);

  useEffect(() => {
    if (data?.subscriptionActive) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.subscription.all,
      });
      const timer = setTimeout(() => navigate("/"), 3000);
      return () => clearTimeout(timer);
    }
  }, [data, navigate, queryClient]);

  if (!sessionId) return null;

  return (
    <div className="min-h-screen cream-gradient flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        <MilklyLogo size="md" />

        {isLoading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <h1 className="text-2xl font-semibold">Verifying payment...</h1>
            <p className="text-muted-foreground">
              Please wait while we confirm your subscription.
            </p>
          </>
        ) : error ? (
          <>
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <h1 className="text-2xl font-semibold">Verification failed</h1>
            <p className="text-muted-foreground">
              If your payment went through, your subscription will be activated
              shortly.
            </p>
            <Link to="/">
              <Button>Go to Dashboard</Button>
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="text-2xl font-semibold">Payment successful!</h1>
            <p className="text-muted-foreground">
              Your subscription is now active. Redirecting to dashboard...
            </p>
            <Link to="/">
              <Button variant="outline">Go now</Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
