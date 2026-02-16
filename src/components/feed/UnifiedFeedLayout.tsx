import { ReactNode } from "react";
import { cn } from "@/lib/Utils";

interface UnifiedFeedLayoutProps {
  children: ReactNode;
  header: ReactNode;
  className?: string;
}

export function UnifiedFeedLayout({ children, header, className }: UnifiedFeedLayoutProps) {
  return (
    <div className="min-h-screen cream-gradient-pro safe-area-top safe-area-bottom flex flex-col">
      {header}
      <main className={cn("flex-1 px-4 py-8 max-w-7xl mx-auto w-full pb-24 space-y-8", className)}>
        {children}
      </main>
    </div>
  );
}
