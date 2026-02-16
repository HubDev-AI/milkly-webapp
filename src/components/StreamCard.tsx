import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { CategoryPill } from "@/components/CategoryPill";
import { ArrowUpRight } from "lucide-react";
import { motion } from "framer-motion";
import type { Stream } from "../../../milkly-backend/src/types";

interface StreamCardProps {
  stream: Stream;
}

export function StreamCard({ stream }: StreamCardProps) {
  return (
    <Link to={`/streams/${stream.id}`} className="block group">
      <GlassCard className="overflow-hidden transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/10 border-white/10 hover:border-primary/30 liquid-glass-shine relative">
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0 space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 font-mono">
                  Channel 0{Math.floor(Math.random() * 9) + 1}
                </span>
                <div className="h-px w-8 bg-primary/20" />
              </div>
              
              <h3 className="text-2xl font-serif font-medium text-foreground leading-tight group-hover:text-primary transition-colors duration-300">
                {stream.name}
              </h3>
              
              {stream.description ? (
                <p className="text-sm text-muted-foreground line-clamp-2 font-medium leading-relaxed max-w-[90%]">
                  {stream.description}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground/40 italic font-medium">
                  No editorial description provided for this stream.
                </p>
              )}

              {/* Categories */}
              <div className="flex flex-wrap gap-2 pt-2">
                {stream.categories.map((category) => (
                  <CategoryPill key={category} category={category} size="sm" />
                ))}
              </div>
            </div>

            <motion.div 
              whileHover={{ x: 3, y: -3 }}
              className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300 text-primary"
            >
              <ArrowUpRight className="h-5 w-5" />
            </motion.div>
          </div>
        </div>
        
        {/* Bottom indicator for active state */}
        <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-700 ease-in-out" />
      </GlassCard>
    </Link>
  );
}
