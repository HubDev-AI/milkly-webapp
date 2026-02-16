import { motion } from "framer-motion";
import { cn } from "@/lib/Utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode;
    hoverEffect?: boolean;
    className?: string;
}

export const GlassCard = ({ children, hoverEffect = true, className, ...props }: GlassCardProps) => {
    return (
        <motion.div
            className={cn(
                "liquid-glass-card relative overflow-hidden",
                className
            )}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            whileHover={hoverEffect ? { 
                y: -5,
                transition: { duration: 0.2 }
            } : {}}
            {...props as any}
        >
            {/* Inner Content */}
            <div className="relative z-10 h-full w-full">
                {children}
            </div>

            {/* Shine Effect on Hover */}
            {hoverEffect && (
                <motion.div
                    className="absolute inset-0 z-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 pointer-events-none"
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                />
            )}
        </motion.div>
    );
};
