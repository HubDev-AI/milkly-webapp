import { type ReactNode } from "react";
import { cn } from "@/lib/Utils";

interface BottomActionBarProps {
  children: ReactNode;
  className?: string;
}

export function BottomActionBar({ children, className }: BottomActionBarProps) {
  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border",
        className
      )}
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex gap-3 px-4 pt-3 max-w-2xl mx-auto">{children}</div>
    </div>
  );
}
