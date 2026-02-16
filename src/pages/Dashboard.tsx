import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { StreamCard } from "@/components/StreamCard";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { GlassCard } from "@/components/ui/GlassCard"; // UPDATED IMPORT
import { Plus, Sparkles, ChevronLeft, ChevronRight, Loader2, Link2, ArrowRight, Lock, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import type { Stream } from "../../../milkly-backend/src/types";

interface LinkedStreamSummary {
  id: string;
  name: string;
  description: string | null;
  streams: Array<{ id: string; name: string; order: number }>;
}

const ITEMS_PER_PAGE = 10;

export default function Dashboard() {
  const [page, setPage] = useState(1);

  const {
    data: response,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.streams.list({ page, limit: ITEMS_PER_PAGE }),
    queryFn: () =>
      api.paginated<Stream>(`/streams?page=${page}&limit=${ITEMS_PER_PAGE}`),
  });

  // Use centralized subscription hook for tier data
  const { canUseLinkedStreams: hasLinkedStreamsAccess } = useSubscription();

  const { data: linkedStreamsResponse, error: linkedStreamsError } = useQuery({
    queryKey: queryKeys.linkedStreams.summary(),
    queryFn: () => api.paginated<LinkedStreamSummary>("/linked-streams?limit=3"),
    enabled: hasLinkedStreamsAccess,
  });

  const streams = response?.data ?? [];
  const pagination = response?.pagination;
  const linkedStreams = linkedStreamsResponse?.data ?? [];
  const linkedStreamsTotal = linkedStreamsResponse?.pagination?.total ?? 0;

  const handlePrevPage = () => {
    if (page > 1) {
      setPage((prev) => prev - 1);
    }
  };

  const handleNextPage = () => {
    if (pagination && page < pagination.totalPages) {
      setPage((prev) => prev + 1);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <MilklyLogo size="sm" />
          <UserMenu />
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto relative z-10 mt-16 md:mt-24">
        {/* Welcome section with Fade In */}
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-primary/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Workspace / Overview</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
              Curated <br />
              <span className="not-italic text-primary">Streams</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md font-serif italic">
              Your editorial content feeds, all in one place.
            </p>
          </div>
        </motion.div>

        {/* New Stream button */}
        {!isLoading && streams && streams.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Link to="/streams/new" className="block">
                <Button variant="glass-premium" className="w-full h-16 text-lg group overflow-hidden relative">
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />
                        New Editorial Stream
                    </span>
                    <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                </Button>
            </Link>
          </motion.div>
        ) : null}

        {/* Linked Streams Section */}
        {!isLoading && streams && streams.length >= 2 ? (
          <LinkedStreamsSection
            hasAccess={hasLinkedStreamsAccess}
            linkedStreams={linkedStreams}
            totalCount={linkedStreamsTotal}
            error={linkedStreamsError}
          />
        ) : null}

        {/* Streams list with Staggered Animation */}
        <div className="space-y-4">
          {isLoading ? (
            <StreamsLoadingSkeleton />
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-destructive">Failed to load streams</p>
              <p className="text-sm text-muted-foreground mt-1">Please try again</p>
            </div>
          ) : streams && streams.length > 0 ? (
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
              {/* Item count */}
              {pagination ? (
                <div className="flex items-center justify-between mb-4 px-2">
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
                    {(page - 1) * ITEMS_PER_PAGE + 1}-
                    {Math.min(page * ITEMS_PER_PAGE, pagination.total)} / {pagination.total}
                  </p>
                  {isFetching ? <Loader2 className="h-3 w-3 animate-spin text-primary" /> : null}
                </div>
              ) : null}

              <div className="space-y-4">
                {streams.map((stream) => (
                    <motion.div key={stream.id} variants={itemVariants}>
                         {/* We wrap the existing StreamCard or replace it. Assuming StreamCard is specific, let's wrap it in a div or motion div */}
                         <StreamCard stream={stream} />
                    </motion.div>
                ))}
              </div>

              {/* Pagination controls */}
              {pagination && pagination.totalPages > 1 ? (
                <div className="flex items-center justify-center gap-4 mt-8">
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={handlePrevPage}
                    disabled={page === 1 || isFetching}
                    className="rounded-full"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-xs font-mono text-muted-foreground">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="glass"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={page >= pagination.totalPages || isFetching}
                    className="rounded-full"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : null}
            </motion.div>
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}

function StreamsLoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <GlassCard key={i} className="p-4" hoverEffect={false}>
          <Skeleton className="h-5 w-2/3 mb-2" />
          <Skeleton className="h-4 w-1/2 mb-3" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-14 rounded-full" />
          </div>
        </GlassCard>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-16 px-6"
    >
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6 backdrop-blur-md border border-white/10">
        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
      </div>
      <h3 className="text-2xl font-serif italic mb-2">Create your first stream</h3>
      <p className="text-sm text-muted-foreground mb-8 max-w-xs mx-auto">
        Start aggregating content from the web and turn it into beautiful newsletters.
      </p>
      <Link to="/streams/new">
        <Button variant="glass-premium" size="lg" className="gap-2 px-10 h-14 rounded-xl">
          <Plus className="h-5 w-5" />
          Start Your First Stream
        </Button>
      </Link>
    </motion.div>
  );
}

// Linked Streams Section Component
interface LinkedStreamsSectionProps {
  hasAccess: boolean;
  linkedStreams: LinkedStreamSummary[];
  totalCount: number;
  error: Error | null;
}

function LinkedStreamsSection({ hasAccess, linkedStreams, totalCount, error }: LinkedStreamsSectionProps) {
  // Show error state if loading failed
  if (error) {
    return (
      <GlassCard className="mb-8 border-destructive/20">
        <div className="p-4 text-center">
          <p className="text-sm text-destructive">Failed to load linked streams</p>
        </div>
      </GlassCard>
    );
  }

  // Show upgrade prompt for free users
  if (!hasAccess) {
    return (
      <GlassCard className="mb-8 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="p-5">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10 shrink-0 border border-primary/20">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground font-serif text-lg">Linked Streams</h3>
                <Badge variant="secondary" className="gap-1 text-[10px] uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                  <Zap className="h-3 w-3" />
                  Professional
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                Combine multiple streams into one powerful feed. Create unified newsletters from all your content sources.
              </p>
              <Link to="/pricing">
                <Button size="sm" variant="glass" className="gap-2 rounded-full text-xs font-bold uppercase tracking-widest">
                  <Lock className="h-3.5 w-3.5" />
                  Upgrade to unlock
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </GlassCard>
    );
  }

  // Show linked streams preview for Professional+ users
  return (
    <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-10"
    >
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="font-bold text-foreground font-sans text-[10px] uppercase tracking-[0.2em] opacity-80">Linked Collections</h2>
          {totalCount > 0 ? (
            <Badge variant="glass" className="text-[10px] w-5 h-5 flex items-center justify-center p-0 rounded-full">{totalCount}</Badge>
          ) : null}
        </div>
        <Link to="/linked-streams">
          <Button variant="ghost" size="sm" className="gap-2 text-[10px] text-primary hover:text-primary hover:bg-primary/10 font-bold uppercase tracking-[0.2em] transition-all duration-300">
            View all collections
            <ArrowRight className="h-3 w-3" />
          </Button>
        </Link>
      </div>

      {linkedStreams.length > 0 ? (
        <div className="grid gap-3">
          {linkedStreams.map((ls, _index) => (
            <Link
              key={ls.id}
              to={`/linked-streams/${ls.id}`}
              state={{ from: "/" }}
              className="block"
            >
              <GlassCard className="hover:border-primary/30 transition-colors cursor-pointer group">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 shrink-0 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      <Link2 className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-serif text-lg text-foreground truncate group-hover:text-primary transition-colors">{ls.name}</p>
                      <p className="text-xs font-mono text-muted-foreground">
                        {ls.streams.length} stream{ls.streams.length !== 1 ? "s" : ""} linked
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </div>
              </GlassCard>
            </Link>
          ))}
          {totalCount > 3 && (
            <Link to="/linked-streams" className="block mt-2">
              <p className="text-xs text-center font-mono text-muted-foreground hover:text-primary transition-colors py-2">
                +{totalCount - 3} more linked stream{totalCount - 3 !== 1 ? "s" : ""}
              </p>
            </Link>
          )}
        </div>
      ) : (
        <GlassCard className="border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors duration-500" />
          <div className="p-6 relative z-10">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                  <Link2 className="h-6 w-6 text-primary" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-primary/20 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary animate-pulse" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-serif italic text-foreground mb-1">Merge your worlds</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Combine multiple streams into one unified masterpiece. Professional curation starts with fusion.
                </p>
              </div>
            </div>
            <div className="mt-6">
              <Link to="/linked-streams" state={{ openCreate: true }}>
                <Button variant="glass" className="w-full gap-2 rounded-xl text-xs font-bold uppercase tracking-widest h-12 border-primary/10 hover:border-primary/30">
                  <Plus className="h-4 w-4" />
                  Create Editorial Fusion
                </Button>
              </Link>
            </div>
          </div>
        </GlassCard>
      )}
    </motion.div>
  );
}
