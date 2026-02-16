import type { ReactNode } from "react";

interface EmptyFeedStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}

export function EmptyFeedState({
  icon,
  title,
  description,
  action,
}: EmptyFeedStateProps) {
  return (
    <div className="text-center py-24 px-6 max-w-sm mx-auto flex flex-col items-center">
      <div className="w-20 h-20 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-md border border-primary/5 shadow-xl flex items-center justify-center mb-8 transform hover:scale-110 transition-transform duration-500">
        <div className="text-primary/40">
          {icon}
        </div>
      </div>
      <h3 className="font-serif text-2xl font-bold text-foreground/90 mb-3 leading-tight">{title}</h3>
      <p className="text-[13px] text-muted-foreground/60 mb-8 leading-relaxed font-sans tracking-wide">
        {description}
      </p>
      {action && (
        <div className="scale-110">
          {action}
        </div>
      )}
    </div>
  );
}
