import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/Api";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Check,
  Crown,
  Zap,
  Sparkles,
  Calendar,
  TrendingUp,
  Settings,
  AlertTriangle,
  Clock,
  FlaskConical,
} from "lucide-react";
import { cn } from "@/lib/Utils";
import { useToast } from "@/hooks/useToast";
import { queryKeys } from "@/lib/QueryKeys";

// Types for subscription data
interface Subscription {
  id: string;
  tier: "essential" | "professional" | "mastery";
  status: "active" | "canceled" | "past_due" | "trialing" | "paused";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Usage {
  refreshesUsed: number;
  aiCreditsUsed: number;
  streamCount: number;
  periodStart: string;
  periodEnd: string;
}

interface Limits {
  maxStreams: number;
  aiCredits: number;
  refreshes: number;
  linkedStreams: boolean;
}

interface FreeTierStatus {
  periodExpired: boolean;
  canRenew: boolean;
  active: boolean;
  message: string | null;
}

interface SubscriptionData {
  subscription: Subscription;
  usage: Usage;
  limits: Limits;
  features: string[];
  snapshotedAt: string | null;
  fromSnapshot: boolean;
  freeTierStatus: FreeTierStatus;
  freeTierRenewalEnabled: boolean;
}

interface PortalResponse {
  url: string;
}

interface DevStatus {
  devMode: boolean;
  paymentConfigured: boolean;
}

import { GlassCard } from "@/components/ui/GlassCard";
import { motion, AnimatePresence } from "framer-motion";

export default function SubscriptionPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Check if dev mode is enabled
  const { data: devStatus } = useQuery({
    queryKey: ["dev-status"],
    queryFn: () => api.get<DevStatus>("/subscription/dev-status"),
  });

  // Fetch subscription data
  const {
    data: subscriptionData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["subscription-details"],
    queryFn: () => api.get<SubscriptionData>("/subscription"),
  });

  // Portal mutation (for managing existing subscription)
  const portalMutation = useMutation({
    mutationFn: () =>
      api.post<PortalResponse>("/subscription/portal", {
        returnUrl: `${window.location.origin}/subscription`,
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

  // Dev mode tier switch mutation
  const devSwitchMutation = useMutation({
    mutationFn: (tier: "essential" | "professional" | "mastery") =>
      api.post<{ message: string }>("/subscription/dev-switch", { tier }),
    onSuccess: (_, tier) => {
      toast({
        title: "Tier switched",
        description: `You are now on the ${tier.charAt(0).toUpperCase() + tier.slice(1)} plan (dev mode)`,
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.subscription.details() });
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.availableCategories() });
      queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.summary() });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "Failed to switch tier";
      toast({
        title: "Switch failed",
        description: message,
        variant: "destructive",
        className: "liquid-glass-overlay",
      });
    },
  });

  const subscription = subscriptionData?.subscription;
  const usage = subscriptionData?.usage;
  const limits = subscriptionData?.limits;
  const features = subscriptionData?.features ?? [];

  const isPaidTier = subscription?.tier === "professional" || subscription?.tier === "mastery";
  const isMastery = subscription?.tier === "mastery";
  const isDevMode = devStatus?.devMode ?? false;

  return (
    <div className="min-h-screen cream-gradient-subtle relative overflow-x-hidden pt-6 pb-20">
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary/3 rounded-full blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-primary/10 backdrop-blur-md">
              <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
              <span className="text-[9px] font-bold tracking-widest text-primary/70 uppercase">Member Portal</span>
            </div>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="relative z-10 px-6 max-w-5xl mx-auto mt-16 md:mt-24">
        {/* Hero Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 border-b border-primary/5 pb-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="text-[10px] font-bold tracking-[0.4em] text-primary/70 uppercase italic">Financial Sovereignty</span>
               <div className="h-px w-8 bg-primary/30" />
            </div>
            <h1 className="text-5xl md:text-7xl font-semibold tracking-tighter text-foreground font-serif italic">
              Subscription <span className="text-primary/10 font-sans not-italic font-black opacity-30 select-none">/ 09</span>
            </h1>
            <p className="text-lg text-primary/60 font-medium max-w-xl leading-relaxed">
              Orchestrate your content delivery nexus. Select a blueprint that aligns with your digital velocity.
            </p>
          </div>
          
          <div className="flex flex-col items-start md:items-end gap-3">
             <div className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Account Integrity</div>
             <div className="px-5 py-2.5 rounded-2xl bg-primary/5 backdrop-blur-3xl border border-primary/10 shadow-lg flex items-center gap-3">
                <div className="flex -space-x-2">
                   <div className="w-8 h-8 rounded-full bg-primary/10 border-2 border-background flex items-center justify-center">
                      <Zap className="w-3.5 h-3.5 text-primary" />
                   </div>
                   <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                   </div>
                </div>
                <div className="h-6 w-px bg-primary/10" />
                <span className="text-xs font-bold text-primary tracking-tight">Standard Tier</span>
             </div>
          </div>
        </div>

        {/* Error state */}
        {error ? (
          <GlassCard className="p-12 text-center bg-destructive/5 border-destructive/20 relative group">
            <div className="absolute inset-0 bg-destructive/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-6 opacity-80" />
            <h2 className="text-2xl font-serif italic text-foreground mb-3">Sync Interrupted</h2>
            <p className="text-muted-foreground max-w-md mx-auto mb-8">
              We encountered a temporal anomaly while retrieving your subscription manifest.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="bg-white/5 border-primary/20 hover:bg-primary/10 group"
            >
              <Loader2 className="mr-2 h-4 w-4 group-hover:animate-spin" />
              Re-establish Connection
            </Button>
          </GlassCard>
        ) : null}

        {/* Loading state */}
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="skeleton"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
            >
              <SubscriptionSkeleton />
            </motion.div>
          ) : null}

          {/* Main content */}
          {subscriptionData && !isLoading ? (
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, staggerChildren: 0.1 }}
              className="space-y-12"
            >
              <div className="space-y-6">
                {/* Past due warning */}
                {subscription?.status === "past_due" ? (
                  <GlassCard className="border-destructive/30 bg-destructive/5 p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground tracking-tight">Payment Manifest Incomplete</h4>
                      <p className="text-xs text-destructive/80 font-medium">Your account synchronization is stalling. Please update your billing credentials.</p>
                    </div>
                  </GlassCard>
                ) : null}

                {/* Free tier expired warning */}
                {subscriptionData?.freeTierStatus?.periodExpired &&
                !subscriptionData?.freeTierStatus?.canRenew ? (
                  <GlassCard className="border-primary/30 bg-primary/5 p-6 space-y-4">
                    <div className="flex gap-4 items-center">
                      <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-lg font-serif italic text-foreground leading-none">Complimentary Cycle Concluded</h4>
                        <p className="text-sm text-primary/70 font-medium mt-1">
                          {subscriptionData.freeTierStatus.message || "Your initial discovery phase has reached its temporal limit."}
                        </p>
                      </div>
                    </div>
                    <Link to="/pricing" className="block">
                      <Button className="w-full bg-primary text-white hover:opacity-90 transition-opacity rounded-xl py-6 font-bold tracking-widest uppercase text-xs">
                        Upgrade to Professional
                      </Button>
                    </Link>
                  </GlassCard>
                ) : null}

                {/* Cancellation notice */}
                {subscription?.cancelAtPeriodEnd ? (
                  <GlassCard className="border-amber-500/30 bg-amber-500/5 p-4 flex gap-4 items-center">
                    <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground tracking-tight">Deprioritization Scheduled</h4>
                      <p className="text-xs text-amber-600/80 font-medium">Manifest ending on {formatDate(subscription.currentPeriodEnd)}. Transitioning to standard tier.</p>
                    </div>
                  </GlassCard>
                ) : null}
              </div>

              {/* Current Plan Section */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start">
                <div className="lg:col-span-3 space-y-12">
                   <CurrentPlanCard
                     subscription={subscription!}
                     isPaidTier={isPaidTier}
                     isMastery={isMastery}
                     onManageBilling={() => portalMutation.mutate()}
                     isLoadingPortal={portalMutation.isPending}
                   />

                   {/* Usage Card Integration */}
                   {subscriptionData?.freeTierStatus?.active !== false ? (
                     <UsageCard
                       usage={usage!}
                       limits={limits!}
                       tier={subscription?.tier ?? "essential"}
                       freeTierRenewalEnabled={subscriptionData?.freeTierRenewalEnabled ?? true}
                     />
                   ) : (
                     <GlassCard className="p-8 opacity-40 grayscale flex items-center justify-center border-dashed border-2">
                        <div className="text-center space-y-2">
                           <TrendingUp className="h-8 w-8 text-primary/40 mx-auto" />
                           <p className="font-serif italic text-lg">Analytics Suspended</p>
                           <p className="text-xs font-bold tracking-widest text-primary/40 uppercase">Upgrade to re-engage metrics</p>
                        </div>
                     </GlassCard>
                   )}
                </div>

                <div className="lg:col-span-2 space-y-12">
                   {/* Features Card */}
                   <FeaturesCard features={features} />

                   {/* Dev Mode Tier Switcher */}
                   {isDevMode ? (
                     <DevModeTierSwitcher
                       currentTier={subscription!.tier}
                       onSwitch={(tier: "essential" | "professional" | "mastery") => devSwitchMutation.mutate(tier)}
                       isLoading={devSwitchMutation.isPending}
                     />
                   ) : null}
                </div>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </main>
    </div>
  );
}

// --- Sub-components ---

interface CurrentPlanCardProps {
  subscription: Subscription;
  isPaidTier: boolean;
  isMastery: boolean;
  onManageBilling: () => void;
  isLoadingPortal: boolean;
}

function CurrentPlanCard({
  subscription,
  isPaidTier,
  isMastery,
  onManageBilling,
  isLoadingPortal,
}: CurrentPlanCardProps) {
  const tierIcons = {
    essential: Sparkles,
    professional: Zap,
    mastery: Crown,
  };

  const tierNames = {
    essential: "Essential",
    professional: "Professional",
    mastery: "Mastery",
  };

  const TierIcon = tierIcons[subscription.tier] || Sparkles;

  return (
    <GlassCard className="p-8 group bg-white/5">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="flex items-start gap-6">
          <div
            className={cn(
              "flex items-center justify-center w-16 h-16 rounded-2xl border-2 shadow-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-3",
              subscription.tier === "essential" && "bg-muted/10 border-white/20",
              subscription.tier === "professional" && "bg-primary/10 border-primary/20",
              subscription.tier === "mastery" && "bg-primary/10 border-primary/20"
            )}
          >
            <TierIcon
              className={cn(
                "h-8 w-8 animate-shimmer",
                subscription.tier === "essential" && "text-muted-foreground/60",
                subscription.tier === "professional" && "text-primary",
                subscription.tier === "mastery" && "text-primary"
              )}
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
               <h3 className="text-3xl font-serif italic text-foreground leading-none">
                 {tierNames[subscription.tier]}
               </h3>
               <StatusBadge status={subscription.status} />
            </div>
            <p className="text-[10px] font-bold tracking-[0.3em] text-primary/40 uppercase">Subscription Identity</p>
          </div>
        </div>

        <div className="flex flex-col md:items-end gap-2 text-right">
           <div className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Cycle Frequency</div>
           <div className="text-xl font-black font-['Bebas_Neue'] tracking-tight text-primary">
              {isPaidTier ? "MONTHLY MANIFEST" : "COMPLIMENTARY"}
           </div>
        </div>
      </div>

      <div className="mt-10 pt-10 border-t border-primary/5 space-y-8">
        {/* Renewal info */}
        {isPaidTier && !subscription.cancelAtPeriodEnd ? (
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/10 border border-primary/5">
            <div className="flex items-center gap-3">
               <Calendar className="h-4 w-4 text-primary/60" />
               <span className="text-sm font-medium text-foreground/80">
                 Automatic Renewal: <span className="font-bold text-foreground">{formatDate(subscription.currentPeriodEnd)}</span>
               </span>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-primary/40" />
          </div>
        ) : (
           <p className="text-xs text-primary/50 font-medium italic">
              Currently utilizing basic node integration without sustained financial commitment.
           </p>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {!isMastery ? (
            <Link to="/pricing" className="flex-1">
              <Button className="w-full bg-primary text-white hover:bg-primary/90 rounded-xl h-14 font-black tracking-widest uppercase text-xs shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all">
                {subscription.tier === "essential" ? "Upgrade Trajectory" : "Evolve Plan"}
              </Button>
            </Link>
          ) : null}

          {isPaidTier ? (
            <Button
              variant="outline"
              className="flex-1 h-14 rounded-xl border-primary/20 bg-white/5 hover:bg-primary/5 font-black tracking-widest uppercase text-xs transition-all gap-3"
              onClick={onManageBilling}
              disabled={isLoadingPortal}
            >
              {isLoadingPortal ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 opacity-60" />
              )}
              Manage Credentials
            </Button>
          ) : null}
        </div>
      </div>
    </GlassCard>
  );
}

interface UsageCardProps {
  usage: Usage;
  limits: Limits;
  tier: "essential" | "professional" | "mastery";
  freeTierRenewalEnabled: boolean;
}

function UsageCard({ usage, limits, tier, freeTierRenewalEnabled }: UsageCardProps) {
  const resetDate = new Date(usage.periodEnd);
  const now = new Date();
  const daysUntilReset = Math.ceil(
    (resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Show reset info for paid tiers, or for free tier when renewal is enabled
  const showResetInfo = tier !== "essential" || freeTierRenewalEnabled;

  return (
    <GlassCard className="p-8 bg-white/5">
      <div className="flex justify-between items-end mb-10 pb-6 border-b border-primary/5">
        <div className="space-y-2">
           <h3 className="text-2xl font-serif italic text-foreground">Usage Dynamics</h3>
           <p className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Real-time resource allocation</p>
        </div>
        {showResetInfo && (
           <div className="text-right">
              <div className="text-[9px] font-black tracking-widest text-primary/30 uppercase mb-1">Synchronization Period</div>
              <div className="text-xs font-bold text-primary px-3 py-1 rounded-full bg-primary/5 border border-primary/10">
                 Resets in {daysUntilReset} days
              </div>
           </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
        {/* Streams (permanent, not monthly) */}
        <UsageItem
          label="Active Streams"
          current={usage.streamCount}
          limit={limits.maxStreams}
          description="Global node capacity"
          isPermanent
        />

        {/* Feed Refreshes */}
        <UsageItem
          label="Refreshes"
          current={usage.refreshesUsed}
          limit={limits.refreshes}
          description="Monthly signal updates"
        />

        {/* AI Credits */}
        <UsageItem
          label="AI Generation"
          current={usage.aiCreditsUsed}
          limit={limits.aiCredits}
          description="Neural processing units"
        />

        <div className="hidden md:flex flex-col justify-end">
           <div className="p-4 rounded-xl bg-primary/5 border border-primary/5 space-y-1">
              <div className="flex items-center gap-2 text-[9px] font-black tracking-widest text-primary/40 uppercase">
                 <Sparkles className="h-3 w-3" />
                 Optimization Note
              </div>
              <p className="text-[10px] text-primary/60 italic leading-relaxed">
                 Unused credits do not rollover. Maximize your output before the next synchronization.
              </p>
           </div>
        </div>
      </div>
    </GlassCard>
  );
}

interface UsageItemProps {
  label: string;
  current: number;
  limit: number;
  description: string;
  isPermanent?: boolean;
}

function UsageItem({
  label,
  current,
  limit,
  description,
  isPermanent: _isPermanent = false,
}: UsageItemProps) {
  const isUnlimited = limit === -1;
  const percentage = limit > 0 ? Math.min((current / limit) * 100, 100) : 0;
  const isAtLimit = !isUnlimited && current >= limit;
  const isNearLimit = !isUnlimited && percentage >= 80 && !isAtLimit;

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div className="space-y-1">
          <p className="text-xs font-black tracking-widest text-primary/40 uppercase">{label}</p>
          <p className="text-[10px] text-primary/30 font-medium italic">{description}</p>
        </div>
        <div className="text-right">
          <p
            className={cn(
              "text-lg font-black font-['Bebas_Neue'] tracking-tight",
              isUnlimited && "text-primary/60",
              isAtLimit && "text-destructive",
              isNearLimit && "text-amber-500"
            )}
          >
            {current} <span className="text-primary/20 mx-1">/</span> {isUnlimited ? "∞" : limit}
          </p>
        </div>
      </div>
      <div className="relative h-1.5 w-full bg-primary/5 rounded-full overflow-hidden border border-primary/5">
        <motion.div
           initial={{ width: 0 }}
           animate={{ width: `${percentage}%` }}
           transition={{ duration: 1, ease: "easeOut" }}
           className={cn(
             "absolute top-0 left-0 h-full rounded-full transition-colors duration-500",
             isAtLimit ? "bg-destructive" : isNearLimit ? "bg-amber-500" : "bg-primary/60"
           )}
        />
        {/* Shimmer on bar */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
      </div>
    </div>
  );
}

interface FeaturesCardProps {
  features: string[];
}

function FeaturesCard({ features }: FeaturesCardProps) {
  if (features.length === 0) return null;

  return (
    <GlassCard className="p-8 bg-white/5">
      <div className="space-y-2 mb-8">
         <h3 className="text-2xl font-serif italic text-foreground">Plan Manifest</h3>
         <p className="text-[10px] font-bold tracking-widest text-primary/40 uppercase">Integrated functionalities</p>
      </div>
      <ul className="space-y-4">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center gap-4 group">
            <div className="w-8 h-8 rounded-lg bg-primary/5 border border-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
              <Check className="h-4 w-4 text-primary opacity-60 group-hover:opacity-100" />
            </div>
            <span className="text-sm font-medium text-foreground/80 group-hover:text-foreground transition-colors">{feature}</span>
          </li>
        ))}
      </ul>
    </GlassCard>
  );
}

interface StatusBadgeProps {
  status: Subscription["status"];
}

function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig = {
    active: {
      label: "Active",
      variant: "default" as const,
      className: "bg-green-500/10 text-green-600 border-green-500/20",
    },
    canceled: {
      label: "Canceled",
      variant: "secondary" as const,
      className: "bg-muted text-muted-foreground",
    },
    past_due: {
      label: "Past Due",
      variant: "destructive" as const,
      className: "",
    },
    trialing: {
      label: "Trial",
      variant: "default" as const,
      className: "bg-blue-500/10 text-blue-600 border-blue-500/20",
    },
    paused: {
      label: "Paused",
      variant: "secondary" as const,
      className: "bg-amber-500/10 text-amber-600 border-amber-500/20",
    },
  };

  const config = statusConfig[status];

  return (
    <Badge
      variant={config.variant}
      className={cn("font-medium", config.className)}
    >
      {config.label}
    </Badge>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-12 animate-pulse">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        <div className="lg:col-span-3 space-y-12">
           <GlassCard className="p-8 h-80 bg-white/5"><div className="w-full h-full" /></GlassCard>
           <GlassCard className="p-8 h-64 bg-white/5"><div className="w-full h-full" /></GlassCard>
        </div>
        <div className="lg:col-span-2 space-y-12">
           <GlassCard className="p-8 h-[500px] bg-white/5"><div className="w-full h-full" /></GlassCard>
        </div>
      </div>
    </div>
  );
}

// --- Utility functions ---

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// --- Dev Mode Tier Switcher ---

interface DevModeTierSwitcherProps {
  currentTier: "essential" | "professional" | "mastery";
  onSwitch: (tier: "essential" | "professional" | "mastery") => void;
  isLoading: boolean;
}

function DevModeTierSwitcher({ currentTier, onSwitch, isLoading }: DevModeTierSwitcherProps) {
  const tiers: Array<{ tier: "essential" | "professional" | "mastery"; name: string; icon: typeof Sparkles }> = [
    { tier: "essential", name: "Essential", icon: Sparkles },
    { tier: "professional", name: "Professional", icon: Zap },
    { tier: "mastery", name: "Mastery", icon: Crown },
  ];

  return (
    <GlassCard className="p-8 border-dashed border-2 border-amber-500/20 bg-amber-500/5">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
           <FlaskConical className="h-5 w-5 text-amber-500" />
        </div>
        <div>
           <h3 className="text-lg font-bold text-amber-700 tracking-tight leading-none uppercase">Nexus Override</h3>
           <p className="text-[10px] font-black tracking-widest text-amber-600/60 uppercase mt-1">Experimental Provisioning</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        {tiers.map(({ tier, name, icon: Icon }) => {
          const isActive = currentTier === tier;
          return (
            <Button
              key={tier}
              variant={isActive ? "default" : "outline"}
              className={cn(
                "h-12 w-full justify-between px-4 rounded-xl transition-all",
                isActive ? "bg-amber-600 border-amber-600 text-white" : "border-amber-500/20 bg-white/5 text-amber-700 hover:bg-amber-500/10",
                isActive && "pointer-events-none"
              )}
              onClick={() => onSwitch(tier)}
              disabled={isLoading || isActive}
            >
              <div className="flex items-center gap-3">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
                <span className="text-[10px] font-black tracking-widest uppercase">{name}</span>
              </div>
              {isActive && <Check className="h-4 w-4" />}
            </Button>
          );
        })}
      </div>
    </GlassCard>
  );
}
