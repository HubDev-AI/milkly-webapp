import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { CreateLinkedStreamDialog } from "@/components/stream/CreateLinkedStreamDialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { GlassCard } from "@/components/ui/GlassCard";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  ArrowLeft,
  Link2,
  Plus,
  ChevronRight,
  Crown,
  Zap,
  Sparkles,
  Loader2,
  ChevronLeft,
  ArrowUpRight,
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { motion } from "framer-motion";
import type { Stream } from "../../../milkly-backend/src/types";

// Types for linked streams
interface LinkedStream {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
  streams: Stream[];
}

const ITEMS_PER_PAGE = 10;

export default function LinkedStreams() {
  const location = useLocation();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Use centralized subscription hook for tier data
  const { canUseLinkedStreams, isLoading: isLoadingSubscription } = useSubscription();
  const queryClient = useQueryClient();

  // Auto-open create dialog if navigated with openCreate state
  useEffect(() => {
    if (location.state?.openCreate && canUseLinkedStreams && !isLoadingSubscription) {
      setCreateDialogOpen(true);
      // Clear the state so it doesn't reopen on back navigation
      window.history.replaceState({}, document.title);
    }
  }, [location.state, canUseLinkedStreams, isLoadingSubscription]);

  // Fetch linked streams
  const {
    data: response,
    isLoading,
    error,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.linkedStreams.list({ page }),
    queryFn: () =>
      api.paginated<LinkedStream>(`/linked-streams?page=${page}&limit=${ITEMS_PER_PAGE}`),
    enabled: canUseLinkedStreams,
  });

  const linkedStreams = response?.data ?? [];
  const pagination = response?.pagination;

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

  const handleLinkedStreamCreated = (createdId?: string) => {
    setCreateDialogOpen(false);
    // Invalidate and refetch linked streams (both list page and dashboard summary)
    queryClient.invalidateQueries({ queryKey: queryKeys.linkedStreams.all });
    // Navigate to the newly created stream
    if (createdId) {
      navigate(`/linked-streams/${createdId}`);
    }
  };

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to="/"
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="px-6 max-w-2xl mx-auto mt-16 md:mt-24">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-primary/40" />
              <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Content Fusion</span>
              <Badge
                variant="outline"
                className="bg-primary/10 text-primary border-primary/30 text-[9px] tracking-widest font-bold"
              >
                <Crown className="h-3 w-3 mr-1" />
                Professional
              </Badge>
            </div>
            <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
              Linked <br />
              <span className="not-italic text-primary">Streams</span>
            </h1>
            <p className="text-base text-muted-foreground max-w-md font-serif italic">
              Fuse multiple content streams into a single, unified newsletter experience.
            </p>
          </div>
          <Button
              onClick={() => setCreateDialogOpen(true)}
              className="gap-2 h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all duration-500 hover:scale-105 active:scale-95 group"
            >
              <Plus className="h-4 w-4 transition-transform duration-500 group-hover:rotate-90" />
              New Stream
          </Button>
        </div>

        {/* Loading subscription */}
        {isLoadingSubscription ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
          </div>
        ) : !canUseLinkedStreams ? (
          // Upgrade prompt for free users
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <UpgradePromptCard />
          </motion.div>
        ) : (
          <>
            {/* Mobile Create button */}
            {linkedStreams && linkedStreams.length > 0 ? (
              <Button
                onClick={() => setCreateDialogOpen(true)}
                variant="glass-premium"
                className="w-full h-14 text-base font-bold gap-2 mb-6 sm:hidden"
              >
                <Plus className="h-5 w-5" />
                New Linked Stream
              </Button>
            ) : null}

            {/* Linked streams list */}
            <div className="space-y-3">
              {isLoading ? (
                <LinkedStreamsLoadingSkeleton />
              ) : error ? (
                <div className="text-center py-12">
                  <p className="text-destructive">Failed to load linked streams</p>
                  <p className="text-sm text-muted-foreground mt-1">Please try again</p>
                </div>
              ) : linkedStreams && linkedStreams.length > 0 ? (
                <>
                  {/* Item count */}
                  {pagination ? (
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        Showing {(page - 1) * ITEMS_PER_PAGE + 1}-
                        {Math.min(page * ITEMS_PER_PAGE, pagination.total)} of{" "}
                        {pagination.total} linked streams
                      </p>
                      {isFetching ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : null}
                    </div>
                  ) : null}

                  <div className="stagger-children space-y-4">
                    {linkedStreams.map((linkedStream) => (
                      <LinkedStreamCard key={linkedStream.id} linkedStream={linkedStream} />
                    ))}
                  </div>

                  {/* Pagination controls */}
                  {pagination && pagination.totalPages > 1 ? (
                    <div className="flex items-center justify-center gap-4 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevPage}
                        disabled={page === 1 || isFetching}
                        className="gap-1"
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextPage}
                        disabled={page >= pagination.totalPages || isFetching}
                        className="gap-1"
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : null}
                </>
              ) : (
                <EmptyState onCreateClick={() => setCreateDialogOpen(true)} />
              )}
            </div>
          </>
        )}
      </main>

      {/* Create dialog */}
      <CreateLinkedStreamDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={handleLinkedStreamCreated}
      />
    </div>
  );
}

interface LinkedStreamCardProps {
  linkedStream: LinkedStream;
}

function LinkedStreamCard({ linkedStream }: LinkedStreamCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <Link to={`/linked-streams/${linkedStream.id}`} className="block group">
        <GlassCard className="overflow-hidden border-white/10 hover:border-primary/30 transition-all duration-500 hover:scale-[1.02] hover:shadow-primary/10 liquid-glass-shine relative">
          <div className="p-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                    <Link2 className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/60 font-mono">
                        Fusion 0{Math.floor(Math.random() * 9) + 1}
                      </span>
                      <div className="h-px w-6 bg-primary/20" />
                    </div>
                    <h3 className="font-serif text-2xl font-medium text-foreground truncate group-hover:text-primary transition-colors duration-300">
                      {linkedStream.name}
                    </h3>
                  </div>
                </div>
                
                {linkedStream.description ? (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2 leading-relaxed font-medium">
                    {linkedStream.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/40 italic font-medium mt-2">
                    No editorial description provided.
                  </p>
                )}

                {/* Linked streams */}
                <div className="flex flex-wrap gap-2 mt-5">
                  {linkedStream.streams.slice(0, 4).map((stream) => (
                    <Badge
                      key={stream.id}
                      variant="outline"
                      className="text-[10px] uppercase tracking-widest bg-background/50 border-primary/10 text-muted-foreground group-hover:border-primary/20 transition-colors"
                    >
                      {stream.name}
                    </Badge>
                  ))}
                  {linkedStream.streams.length > 4 ? (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-widest bg-muted/30">
                      +{linkedStream.streams.length - 4} more
                    </Badge>
                  ) : null}
                </div>
              </div>

              <motion.div 
                whileHover={{ x: 3, y: -3 }}
                className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10 group-hover:bg-primary/20 group-hover:border-primary/30 transition-all duration-300 text-primary shrink-0"
              >
                <ArrowUpRight className="h-5 w-5" />
              </motion.div>
            </div>
          </div>
          
          {/* Bottom indicator for active state */}
          <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-primary group-hover:w-full transition-all duration-700 ease-in-out" />
        </GlassCard>
      </Link>
    </motion.div>
  );
}

function UpgradePromptCard() {
  return (
    <Card glass className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-background to-background">
      <CardContent className="p-8">
        <div className="text-center">
          {/* Icon */}
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 border border-primary/20"
          >
            <Link2 className="h-10 w-10 text-primary" />
          </motion.div>

          <h3 className="text-2xl font-serif italic mb-3">Unlock <span className="text-primary">Linked Streams</span></h3>
          <p className="text-sm text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
            Architect your perfect newsletter by combining multiple content pools into a single, high-fidelity stream. Professional-grade curation starts here.
          </p>

          {/* Benefits */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left max-w-md mx-auto">
            {[
              "Combine unlimited streams",
              "Unified feed orchestration",
              "Advanced source mixing",
              "Professional Editorial interface",
            ].map((benefit, index) => (
              <motion.div 
                key={index} 
                initial={{ x: -10, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index }}
                className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-foreground/70"
              >
                <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-3 w-3 text-primary shrink-0" />
                </div>
                <span>{benefit}</span>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <Link to="/pricing">
            <Button
              variant="glass-premium"
              className="h-14 px-10 text-sm font-bold uppercase tracking-[0.2em]"
            >
              <Zap className="h-4 w-4 mr-2" />
              Elevate to Professional
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function LinkedStreamsLoadingSkeleton() {
  return (
    <>
      {[1, 2, 3].map((i) => (
        <Card key={i} glass>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-5 w-2/3" />
            </div>
            <Skeleton className="h-4 w-1/2 mb-3" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

interface EmptyStateProps {
  onCreateClick: () => void;
}

function EmptyState({ onCreateClick }: EmptyStateProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="text-center py-20 px-6 max-w-sm mx-auto"
    >
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 mb-6 border border-primary/20 backdrop-blur-md">
        <Link2 className="h-10 w-10 text-primary animate-pulse" />
      </div>
      <h3 className="text-2xl font-serif italic mb-3 text-foreground">Draft your first <span className="text-primary">Editorial Fusion</span></h3>
      <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
        Orchestrate multiple content streams into a single, high-fidelity experience. Perfect for multi-source editorial workflows.
      </p>
      <Button 
        onClick={onCreateClick} 
        variant="glass-premium"
        className="h-14 px-10 gap-2 text-sm font-bold uppercase tracking-[0.2em]"
      >
        <Plus className="h-5 w-5" />
        Create Fusion
      </Button>
    </motion.div>
  );
}
