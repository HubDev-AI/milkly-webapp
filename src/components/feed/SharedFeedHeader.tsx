import { Link } from "react-router-dom";
import { ArrowLeft, Crown, FileText } from "lucide-react";
import { ReactNode } from "react";

interface SharedFeedHeaderProps {
  title: string;
  backTo: string;
  icon?: ReactNode;
  badges?: {
    tierName?: string | null;
    hasTemplate?: boolean;
    hasCustom?: boolean;
  };
  actions?: ReactNode;
  description?: string | null;
  bottomBar?: ReactNode;
  isLinkedStream?: boolean;
  memberStreams?: Array<{ id: string; name: string }>;
}

export function SharedFeedHeader({
  title,
  backTo,
  _icon,
  badges,
  actions,
  description,
  bottomBar,
  isLinkedStream,
  memberStreams,
}: SharedFeedHeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/5 transition-all duration-300 pointer-events-none">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 pt-4 pointer-events-auto">
        <div className="relative">
          {/* Minimalist Editorial Container */}
          <div className="bg-white/60 dark:bg-black/40 backdrop-blur-[40px] border border-primary/5 rounded-[2rem] overflow-hidden">
            
            {/* Main Header Content */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-6 pt-5 pb-3">
                <div className="flex items-center gap-5 min-w-0">
                  <Link
                    to={backTo}
                    className="p-2 -ml-1 rounded-full bg-primary/5 hover:bg-primary/10 text-primary transition-all duration-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Link>
                  
                  <div className="min-w-0 flex flex-col gap-0.5">
                    <div className="flex items-center gap-4">
                       <h1 className="font-serif text-2xl font-black tracking-tight text-foreground/90">
                         {title}
                       </h1>
                       {isLinkedStream && (
                         <span className="text-[9px] font-bold uppercase tracking-widest text-primary/40 bg-primary/5 px-2 py-0.5 rounded-full">
                           Collection
                         </span>
                       )}
                    </div>
                    
                    {description && (
                      <p className="text-[11px] text-muted-foreground/60 line-clamp-1 max-w-md hidden sm:block">
                        {description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {/* Badges */}
                  <div className="hidden lg:flex items-center gap-2">
                    {badges?.tierName && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-amber-600/80 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <Crown className="h-3 w-3 inline mr-1 -mt-0.5" />
                        {badges.tierName}
                      </span>
                    )}
                    {badges?.hasTemplate && (
                      <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/80 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <FileText className="h-3 w-3 inline mr-1 -mt-0.5" />
                        Template
                      </span>
                    )}
                  </div>

                  {actions && (
                    <>
                      <div className="h-6 w-px bg-primary/10" />
                      <div className="flex items-center gap-2">{actions}</div>
                    </>
                  )}
                </div>
              </div>

              {/* Integrated Control Strip (Clean and Minimal) - One level down */}
              <div className="px-8 pb-5 border-t border-primary/5 pt-5">
                <div className="flex flex-col md:flex-row items-center gap-10">
                  {bottomBar}
                </div>
              </div>

              {/* Collections Toolbar - Text led */}
              {memberStreams && memberStreams.length > 0 && (
                <div className="px-8 pb-4 pt-0 border-t border-primary/5 bg-black/5 dark:bg-white/5">
                   <div className="flex flex-wrap gap-6 items-center py-3">
                     <span className="text-[8px] font-black text-primary/20 uppercase tracking-[0.3em]">ASSOCIATED STREAMS:</span>
                     {memberStreams.map((stream) => (
                       <Link 
                         key={stream.id} 
                         to={`/streams/${stream.id}`}
                         className="text-[9px] font-black text-primary/30 hover:text-primary transition-colors uppercase tracking-[0.2em]"
                       >
                         {stream.name}
                       </Link>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
