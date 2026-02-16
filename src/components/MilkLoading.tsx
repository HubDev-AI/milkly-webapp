import { createPortal } from "react-dom";
import { cn } from "@/lib/Utils";

interface MilkLoadingProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  fullHeight?: boolean;
}

export function MilkLoading({
  message = "Loading...",
  size = "md",
  className,
  fullHeight = true,
}: MilkLoadingProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
  };

  const textSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", fullHeight && "min-h-screen", className)}>
      {/* Milk drop animation */}
      <div className={cn("relative", sizeClasses[size])}>
        {/* Glass container */}
        <div className="absolute inset-0 rounded-b-full rounded-t-lg border-2 border-[hsl(35_20%_88%)] bg-gradient-to-b from-transparent to-[hsl(40_50%_99%_/_0.3)]" />

        {/* Rising milk */}
        <div className="absolute bottom-0 left-0 right-0 overflow-hidden rounded-b-full">
          <div className="milk-rise-animation bg-gradient-to-t from-[hsl(40_50%_98%)] via-[hsl(40_40%_96%)] to-[hsl(40_35%_95%)]" />
        </div>

        {/* Cream swirl on top */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-3/4 h-1 rounded-full bg-[hsl(35_30%_90%)] opacity-60 cream-swirl-animation" />
      </div>

      {/* Message */}
      {message ? (
        <p
          className={cn(
            "text-muted-foreground animate-pulse",
            textSizeClasses[size]
          )}
        >
          {message}
        </p>
      ) : null}

      {/* Inline styles for the animation */}
      <style>{`
        @keyframes milk-rise {
          0% {
            height: 10%;
          }
          50% {
            height: 70%;
          }
          100% {
            height: 10%;
          }
        }

        @keyframes cream-swirl {
          0%, 100% {
            transform: translateX(-50%) scaleX(0.8);
            opacity: 0.4;
          }
          50% {
            transform: translateX(-50%) scaleX(1.2);
            opacity: 0.8;
          }
        }

        .milk-rise-animation {
          animation: milk-rise 2s ease-in-out infinite;
          height: 10%;
        }

        .cream-swirl-animation {
          animation: cream-swirl 2s ease-in-out infinite;
          animation-delay: 0.5s;
        }
      `}</style>
    </div>
  );
}

// Full-page milk loading overlay
interface MilkLoadingOverlayProps {
  message?: string;
  isVisible: boolean;
}

export function MilkLoadingOverlay({
  message = "Preparing something delicious...",
  isVisible,
}: MilkLoadingOverlayProps) {
  if (!isVisible) return null;

  // Use createPortal to render at document.body to ensure it's above all modals/sheets
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background/80 backdrop-blur-sm animate-cream-rise">
      <div className="cream-card p-8 max-w-sm mx-4 text-center">
        <MilkLoading message={message} size="lg" fullHeight={false} />
      </div>
    </div>,
    document.body
  );
}

// Inline milk spinner for buttons
export function MilkSpinner({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative w-4 h-4 rounded-full overflow-hidden border border-current/30",
        className
      )}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(from 0deg, transparent 0%, currentColor 50%, transparent 100%)",
          animation: "spin 1s linear infinite",
        }}
      />
      <div className="absolute inset-[2px] rounded-full bg-current/10" />
    </div>
  );
}
