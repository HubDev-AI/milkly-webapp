import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import {
  Zap,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Check,
  Crown,
  RefreshCw,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/Utils";
import type { LimitError, LimitType } from "@/lib/Api";

interface UpgradePromptProps {
  /** Whether the modal is open */
  open: boolean;
  /** Callback when the modal should close */
  onClose: () => void;
  /** The limit error data from the API */
  limitError: LimitError | null;
  /** Optional: Custom title override */
  title?: string;
  /** Optional: Custom description override */
  description?: string;
  /** The credit cost for this operation, if applicable */
  creditCost?: number;
  /** Human-readable formatted reset time (e.g., "in 5 days") */
  formattedResetTime?: string;
  /** Formatted credit message with remaining credits */
  formattedCreditMessage?: string;
}

// Human-readable labels for each limit type
const limitLabels: Record<LimitType, string> = {
  aiCredits: "AI credits",
  refreshes: "Feed refreshes",
  maxStreams: "Active streams",
  maxEmailSubscribers: "Email subscribers",
  maxStorageMB: "Storage",
  linkedStreams: "Linked streams",
  allowCustomItems: "Custom items",
  allowedCategories: "Categories",
};

// Icons for each limit type
const limitIcons: Record<LimitType, typeof Zap> = {
  aiCredits: Sparkles,
  refreshes: RefreshCw,
  maxStreams: TrendingUp,
  maxEmailSubscribers: TrendingUp,
  maxStorageMB: Zap,
  linkedStreams: Zap,
  allowCustomItems: Zap,
  allowedCategories: Lock,
};

const professionalBenefits = [
  "1,200 AI credits per month",
  "300 feed refreshes per month",
  "All content categories",
  "Linked streams",
  "Unlimited templates",
  "Priority support",
];

export function UpgradePrompt({
  open,
  onClose,
  limitError,
  title,
  description,
  creditCost,
  formattedResetTime,
  formattedCreditMessage,
}: UpgradePromptProps) {
  const navigate = useNavigate();

  if (!limitError) return null;

  const LimitIcon = limitIcons[limitError.limit] || Zap;
  const limitLabel = limitLabels[limitError.limit] || "Usage limit";
  const isFeatureLocked = limitError.code === "FEATURE_LOCKED";
  const isAiCredits = limitError.limit === "aiCredits";
  const isRefreshes = limitError.limit === "refreshes";

  // Calculate progress percentage for usage limits
  const progressPercent =
    limitError.max && limitError.max > 0
      ? Math.min(((limitError.current ?? 0) / limitError.max) * 100, 100)
      : 100;

  const handleUpgrade = () => {
    onClose();
    navigate(limitError.upgradeUrl || "/pricing");
  };

  const displayTitle =
    title ||
    (isFeatureLocked
      ? "Unlock This Feature"
      : "You've Reached Your Limit");

  const displayDescription =
    description ||
    limitError.message ||
    (isFeatureLocked
      ? "This feature is available on Professional. Upgrade to unlock it."
      : `You've used all your ${limitLabel.toLowerCase()} for this period.`);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden bg-card border-border/50">
        {/* Gradient header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-primary/10 via-card to-accent/5 animate-cream-rise">
          {/* Floating icon */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 rounded-full bg-gradient-to-br from-primary/20 to-accent/10 border border-primary/20">
                <LimitIcon className="h-8 w-8 text-primary" />
              </div>
            </div>
          </div>

          <DialogHeader className="text-center space-y-2">
            <DialogTitle className="text-xl font-semibold">
              {displayTitle}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {displayDescription}
            </DialogDescription>
          </DialogHeader>

          {/* Limit indicator - only show for LIMIT_EXCEEDED */}
          {!isFeatureLocked && (
            <div className="mt-6 animate-milk-pour">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground">{limitLabel}</span>
                <span className="font-medium text-foreground">
                  {limitError.current} /{" "}
                  {limitError.max === -1 ? "Unlimited" : limitError.max}
                </span>
              </div>
              <div className="relative">
                <Progress value={progressPercent} className="h-3 bg-secondary" />
                {progressPercent >= 100 && (
                  <div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-accent animate-pulse-glow"
                    style={{ width: "100%" }}
                  />
                )}
              </div>

              {/* Credit-specific messaging */}
              {isAiCredits && (
                <div className="text-sm text-muted-foreground mt-3 text-center space-y-1">
                  {formattedCreditMessage ? (
                    <p>{formattedCreditMessage}</p>
                  ) : creditCost ? (
                    <p>
                      This requires {creditCost} credits. You have{" "}
                      {Math.max(
                        0,
                        (limitError.max ?? 0) - (limitError.current ?? 0)
                      )}{" "}
                      remaining.
                    </p>
                  ) : null}
                  {formattedResetTime && (
                    <p className="text-xs">Credits reset {formattedResetTime}</p>
                  )}
                </div>
              )}

              {/* Refresh-specific messaging */}
              {isRefreshes && (
                <div className="text-sm text-muted-foreground mt-3 text-center space-y-1">
                  <p>
                    You have used all your feed refreshes for this period.
                  </p>
                  {formattedResetTime && (
                    <p className="text-xs">
                      Refreshes reset {formattedResetTime}
                    </p>
                  )}
                </div>
              )}

              {/* Default reset time for other limits */}
              {!isAiCredits && !isRefreshes && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {formattedResetTime
                    ? `Resets ${formattedResetTime}`
                    : "Your limit resets weekly"}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-5 space-y-4">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground">
              With Professional you get:
            </span>
            <Badge
              variant="outline"
              className="ml-auto bg-primary/10 text-primary border-primary/30 text-xs"
            >
              Popular
            </Badge>
          </div>

          <ul className="grid grid-cols-2 gap-x-4 gap-y-2 stagger-children">
            {professionalBenefits.map((benefit, index) => (
              <li
                key={index}
                className="flex items-center gap-2 text-sm text-muted-foreground"
              >
                <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action buttons */}
        <div className="px-6 pb-6 pt-2 space-y-3">
          <Button
            onClick={handleUpgrade}
            className={cn(
              "w-full h-11 font-medium",
              "bg-gradient-to-r from-primary to-primary/80",
              "hover:from-primary/90 hover:to-primary/70",
              "shadow-lg shadow-primary/20",
              "transition-all duration-200"
            )}
          >
            <Zap className="h-4 w-4 mr-2" />
            Upgrade to Professional
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>

          <Button
            variant="ghost"
            onClick={onClose}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default UpgradePrompt;
