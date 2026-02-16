import { Link } from "react-router-dom";
import { cn } from "@/lib/Utils";

interface MilklyLogoProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function MilklyLogo({ size = "md", className }: MilklyLogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-5xl",
  };

  const estClasses = {
    sm: "text-[8px]",
    md: "text-[10px]",
    lg: "text-xs",
  };

  return (
    <Link to="/" className={cn("flex flex-col items-start group", className)}>
      <span className={cn(
        "font-black tracking-tighter uppercase font-['Bebas_Neue'] group-hover:opacity-80 transition-colors text-foreground leading-[0.9]",
        sizeClasses[size]
      )}>
        Milkly
      </span>
      <span className={cn(
        "font-mono tracking-[0.3em] opacity-40 group-hover:opacity-60 transition-colors text-foreground",
        estClasses[size]
      )}>
        EST. 2026
      </span>
    </Link>
  );
}
