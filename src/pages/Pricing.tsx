import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { api } from "@/lib/Api";
import { useAuth } from "@/lib/AuthClient";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Switch } from "@/components/ui/Switch";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/Utils";
import { useToast } from "@/hooks/useToast";
import { queryKeys } from "@/lib/QueryKeys";

// Types for subscription data
interface PlanLimits {
  maxStreams: number;
  maxTemplatesPerStream: number;
  milkPerWeek: number;
  generatesPerWeek: number;
  publishPerWeek: number;
  linkedStreams: boolean;
}

interface Plan {
  tier: "essential" | "professional" | "mastery";
  name: string;
  description: string;
  limits: PlanLimits;
  features: string[];
  pricing: {
    monthly: number;
    yearly: number;
  };
}

interface Subscription {
  tier: "essential" | "professional" | "mastery";
  status: string;
  interval?: "monthly" | "yearly";
  currentPeriodEnd?: string;
}

interface CheckoutResponse {
  url: string;
}

interface PortalResponse {
  url: string;
}

interface DevStatus {
  devMode: boolean;
  paymentConfigured: boolean;
}

export default function Pricing() {
  const { user } = useAuth();
  const [isYearly, setIsYearly] = useState(true);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Check if dev mode is enabled
  const { data: devStatus } = useQuery({
    queryKey: ["dev-status"],
    queryFn: () => api.get<DevStatus>("/subscription/dev-status"),
  });

  const isDevMode = devStatus?.devMode ?? false;

  // Fetch tier features from public endpoint
  const { data: tierFeatures } = useQuery({
    queryKey: ["tier-config"],
    queryFn: () => api.get<Record<string, string[]>>("/public/tier-config"),
    staleTime: 5 * 60 * 1000,
  });

  // Fetch available plans
  const {
    data: plans,
    isLoading: plansLoading,
    error: plansError,
  } = useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => api.get<Plan[]>("/subscription/plans"),
  });

  // Use fetched tier features from API
  const displayFeatures = tierFeatures ?? {};

  // Fetch current subscription (only if logged in)
  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ["subscription"],
    queryFn: () => api.get<Subscription>("/subscription"),
    enabled: !!user,
  });

  // Dev mode tier switch mutation
  const devSwitchMutation = useMutation({
    mutationFn: (tier: string) =>
      api.post<{ message: string }>("/subscription/dev-switch", { tier }),
    onSuccess: (_, tier) => {
      toast({
        title: "Tier switched",
        description: `You are now on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.details() });
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.availableCategories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() });
      setTimeout(() => navigate("/"), 500);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to switch tier";
      toast({
        title: "Switch failed",
        description: message,
        variant: "destructive",
      });
    },
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (data: {
      tier: string;
      interval: "monthly" | "yearly";
    }) =>
      api.post<CheckoutResponse>("/subscription/checkout", {
        tier: data.tier,
        interval: data.interval,
        successUrl: `${window.location.origin}/checkout/success`,
        cancelUrl: `${window.location.origin}/pricing`,
      }),
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Checkout unavailable",
          description: "Unable to create checkout session. Please try again later.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to start checkout";
      const isStripeNotConfigured = message.toLowerCase().includes("stripe") ||
                                     message.toLowerCase().includes("not configured") ||
                                     message.toLowerCase().includes("payment");
      toast({
        title: "Checkout unavailable",
        description: isStripeNotConfigured
          ? "Payment processing is not available yet. This feature will be enabled soon."
          : message,
        variant: "destructive",
      });
    },
  });

  // Portal mutation (for managing existing subscription)
  const portalMutation = useMutation({
    mutationFn: () =>
      api.post<PortalResponse>("/subscription/portal", {
        returnUrl: `${window.location.origin}/pricing`,
      }),
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast({
          title: "Billing portal unavailable",
          description: "Unable to open billing portal. Please try again later.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Unable to open billing portal";
      const isStripeNotConfigured = message.toLowerCase().includes("stripe") ||
                                     message.toLowerCase().includes("not configured");
      toast({
        title: "Billing portal unavailable",
        description: isStripeNotConfigured
          ? "Billing management is not available yet. This feature will be enabled soon."
          : message,
        variant: "destructive",
      });
    },
  });

  const handleSelectPlan = (tier: string) => {
    if (!user) {
      // Redirect to login with return URL
      window.location.href = `/login?returnTo=/pricing`;
      return;
    }

    // In dev mode, switch tiers directly without payment
    if (isDevMode) {
      devSwitchMutation.mutate(tier);
      return;
    }

    if (tier === "essential") {
      // Already on essential tier or downgrade through portal
      if (subscription && subscription.tier !== "essential") {
        portalMutation.mutate();
      }
      return;
    }

    checkoutMutation.mutate({
      tier,
      interval: isYearly ? "yearly" : "monthly",
    });
  };

  const isCurrentPlan = (tier: string) => {
    return subscription?.tier === tier;
  };

  const getButtonText = (tier: string) => {
    if (!user) return "Get Started";
    if (isCurrentPlan(tier)) return "Current Plan";
    if (subscription?.tier === "mastery") return "Contact Us";
    if (tier === "essential" && subscription?.tier !== "essential") return "Downgrade";
    return "Upgrade";
  };

  const getButtonVariant = (tier: string): "default" | "outline" | "secondary" => {
    if (isCurrentPlan(tier)) return "secondary";
    if (tier === "professional") return "default";
    return "outline";
  };

  const isLoading = plansLoading || (user && subscriptionLoading);

  return (
    <div className="min-h-screen cream-gradient safe-area-top safe-area-bottom">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-4">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Back</span>
            </Link>
            <MilklyLogo size="sm" />
          </div>
          {user ? <UserMenu /> : (
            <Link to="/login">
              <Button variant="outline" size="sm">Sign In</Button>
            </Link>
          )}
        </div>
      </header>

      <main className="px-4 py-8 md:py-12 max-w-6xl mx-auto">
        {/* Hero section */}
        <div className="text-center mb-10 md:mb-14">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-semibold text-foreground mb-4">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. All plans include core features to help you create beautiful newsletters.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4">
            <span className={cn(
              "text-sm font-medium transition-colors",
              !isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              aria-label="Toggle yearly billing"
            />
            <span className={cn(
              "text-sm font-medium transition-colors",
              isYearly ? "text-foreground" : "text-muted-foreground"
            )}>
              Yearly
            </span>
            {isYearly ? (
              <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20">
                Save up to 30%
              </Badge>
            ) : null}
          </div>
        </div>

        {/* Error state */}
        {plansError ? (
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium mb-2">Failed to load plans</p>
            <p className="text-sm text-muted-foreground">Please refresh the page to try again.</p>
          </div>
        ) : null}

        {/* Loading state */}
        {isLoading && !plansError ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="cream-card p-6">
                <Skeleton className="h-6 w-20 mb-2" />
                <Skeleton className="h-10 w-32 mb-4" />
                <Skeleton className="h-4 w-full mb-6" />
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map((j) => (
                    <Skeleton key={j} className="h-4 w-full" />
                  ))}
                </div>
                <Skeleton className="h-10 w-full mt-6" />
              </Card>
            ))}
          </div>
        ) : null}

        {/* Pricing cards */}
        {plans && !isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 stagger-children">
            {plans.map((plan) => (
              <PricingCard
                key={plan.tier}
                plan={plan}
                features={displayFeatures[plan.tier] ?? plan.features}
                isYearly={isYearly}
                isCurrentPlan={isCurrentPlan(plan.tier)}
                isRecommended={plan.tier === "professional"}
                buttonText={getButtonText(plan.tier)}
                buttonVariant={getButtonVariant(plan.tier)}
                onSelect={() => handleSelectPlan(plan.tier)}
                isLoading={checkoutMutation.isPending || portalMutation.isPending || devSwitchMutation.isPending}
                disabled={isCurrentPlan(plan.tier)}
              />
            ))}
          </div>
        ) : null}

        {/* Current subscription info */}
        {user && subscription && subscription.tier !== "essential" ? (
          <div className="mt-10 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              Need to manage your subscription or update payment method?
            </p>
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Manage Subscription
            </Button>
          </div>
        ) : null}

        {/* FAQ or features section */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-4">All plans include</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              "Content aggregation",
              "AI-powered writing",
              "Custom templates",
              "Email delivery",
            ].map((feature) => (
              <div
                key={feature}
                className="flex items-center justify-center gap-2 text-muted-foreground py-2"
              >
                <Check className="h-4 w-4 text-primary" />
                <span className="text-sm">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

interface PricingCardProps {
  plan: Plan;
  features: string[];
  isYearly: boolean;
  isCurrentPlan: boolean;
  isRecommended: boolean;
  buttonText: string;
  buttonVariant: "default" | "outline" | "secondary";
  onSelect: () => void;
  isLoading: boolean;
  disabled: boolean;
}

function PricingCard({
  plan,
  features,
  isYearly,
  isCurrentPlan,
  isRecommended,
  buttonText,
  buttonVariant,
  onSelect,
  isLoading,
  disabled,
}: PricingCardProps) {
  const price = isYearly ? plan.pricing.yearly : plan.pricing.monthly;
  const monthlyEquivalent = isYearly ? Math.round(plan.pricing.yearly / 12) : plan.pricing.monthly;

  const tierIcons = {
    essential: Sparkles,
    professional: Zap,
    mastery: Crown,
  };

  const TierIcon = tierIcons[plan.tier];

  return (
    <Card
      className={cn(
        "cream-card relative flex flex-col transition-all duration-300",
        isRecommended && "ring-2 ring-primary glow-primary md:scale-105",
        isCurrentPlan && "ring-2 ring-accent"
      )}
    >
      {/* Recommended badge */}
      {isRecommended ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            Most Popular
          </Badge>
        </div>
      ) : null}

      {/* Current plan badge */}
      {isCurrentPlan ? (
        <div className="absolute -top-3 right-4">
          <Badge className="bg-primary text-primary-foreground">
            Current
          </Badge>
        </div>
      ) : null}

      <CardHeader className="pb-4">
        <div className="flex items-center gap-2 mb-2">
          <TierIcon className={cn(
            "h-5 w-5",
            plan.tier === "essential" && "text-muted-foreground",
            plan.tier === "professional" && "text-primary",
            plan.tier === "mastery" && "text-primary"
          )} />
          <CardTitle className="text-xl">{plan.name}</CardTitle>
        </div>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* Price */}
        <div className="mb-6">
          {price === 0 ? (
            <div className="flex items-baseline gap-1">
              <span className="text-4xl font-bold text-foreground">Free</span>
            </div>
          ) : (
            <>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-foreground">
                  ${monthlyEquivalent}
                </span>
                <span className="text-muted-foreground">/month</span>
              </div>
              {isYearly ? (
                <p className="text-sm text-muted-foreground mt-1">
                  ${price} billed yearly
                </p>
              ) : null}
            </>
          )}
        </div>

        {/* Features list */}
        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-3">
              <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
              <span className="text-sm text-foreground">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          className="w-full"
          variant={buttonVariant}
          onClick={onSelect}
          disabled={disabled || isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : null}
          {buttonText}
        </Button>
      </CardFooter>
    </Card>
  );
}
