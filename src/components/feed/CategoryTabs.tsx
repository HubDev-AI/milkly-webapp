import { motion } from "framer-motion";
import { cn } from "@/lib/Utils";
import type { Category } from "../../../../milkly-backend/src/types";

interface CategoryTabsProps {
  tabs: { value: string; label: string }[];
  activeTab: string;
  onTabChange: (value: string) => void;
  allowedCategories?: Category[];
}

export function CategoryTabs({
  tabs,
  activeTab,
  onTabChange,
  allowedCategories,
}: CategoryTabsProps) {
  const filteredTabs = allowedCategories
    ? tabs.filter(
        (tab) =>
          tab.value === "all" ||
          allowedCategories.includes(tab.value as Category)
      )
    : tabs;

  return (
    <div className="flex items-center gap-0.5 p-1 h-10 bg-white/20 dark:bg-black/20 backdrop-blur-xl rounded-full border border-primary/20">
      {filteredTabs.map((tab) => {
        const isActive = activeTab === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onTabChange(tab.value)}
            className={cn(
              "relative px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-full transition-all duration-200",
              isActive 
                ? "text-white bg-primary" 
                : "text-primary/70 hover:text-primary hover:bg-primary/5"
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabPill"
                className="absolute inset-0 bg-primary rounded-full"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
