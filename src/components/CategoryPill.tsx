import { memo } from "react";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/Utils";
import { CATEGORY_CONFIG } from "@/lib/Constants";
import type { Category } from "../../../milkly-backend/src/types";

interface CategoryPillProps {
  category: Category;
  size?: "sm" | "md";
  className?: string;
  showIcon?: boolean;
}

export const CategoryPill = memo(function CategoryPill({ category, size = "sm", className, showIcon = false }: CategoryPillProps) {
  const config = CATEGORY_CONFIG[category];
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "font-medium transition-colors gap-1",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1",
        config.badgeClass,
        className
      )}
    >
      {showIcon && <Icon className={size === "sm" ? "h-3 w-3" : "h-3.5 w-3.5"} />}
      {config.label}
    </Badge>
  );
});

// eslint-disable-next-line react-refresh/only-export-components
export function getCategoryLabel(category: Category): string {
  return CATEGORY_CONFIG[category].label;
}
