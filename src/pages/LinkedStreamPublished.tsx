import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/hooks/useToast";
import { MilklyLogo } from "@/components/MilklyLogo";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropdownMenu";
import {
  ArrowLeft,
  Calendar,
  FileText,
  Layers,
  ChevronRight,
  ChevronLeft,
  Inbox,
  Loader2,
  MoreVertical,
  Trash2,
  Send,
  Users,
  Link2,
} from "lucide-react";
import { useAuth } from "@/lib/AuthClient";
import { getPublicNewsletterUrl } from "@/lib/Constants";
import type { Newsletter } from "../../../milkly-backend/src/types";

interface LinkedStream {
  id: string;
  name: string;
  description: string | null;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

interface PublishedNewsletter extends Newsletter {
  _count?: {
    items: number;
  };
}

interface SendEmailResponse {
  message: string;
  subject: string;
  subscriberCount: number;
  successful?: number;
  failed?: number;
}

const ITEMS_PER_PAGE = 10;

export default function LinkedStreamPublished() {
  const { id } = useParams<{ id: string }>();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false);
  const [selectedNewsletter, setSelectedNewsletter] = useState<PublishedNewsletter | null>(null);
  const [emailSubject, setEmailSubject] = useState("");

  const {
    data: linkedStream,
    isLoading: isLoadingLinkedStream,
    error: linkedStreamError,
  } = useQuery({
    queryKey: ["linked-stream", id],
    queryFn: () => api.get<LinkedStream>(`/linked-streams/${id}`),
    enabled: !!id,
  });

  const {
    data: response,
    isLoading: isLoadingNewsletters,
    error: newslettersError,
    isFetching,
  } = useQuery({
    queryKey: ["linked-stream", id, "newsletters", "published", page],
    queryFn: () =>
      api.paginated<PublishedNewsletter>(
        `/linked-streams/${id}/newsletters?status=published&page=${page}&limit=${ITEMS_PER_PAGE}`
      ),
    enabled: !!id,
  });

  const newsletters = response?.data ?? [];
  const pagination = response?.pagination;

  const isLoading = isLoadingLinkedStream || isLoadingNewsletters;
  const error = linkedStreamError || newslettersError;

  const deleteMutation = useMutation({
    mutationFn: (newsletterId: string) =>
      api.delete<void>(`/newsletters/${newsletterId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["linked-stream", id, "newsletters"] });
      toast({
        title: "Deleted",
        description: "Newsletter has been deleted.",
      });
      setDeleteDialogOpen(false);
      setSelectedNewsletter(null);
    },
    onError: (error) => {
      toast({
        title: "Failed to delete",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const sendEmailMutation = useMutation({
    mutationFn: ({ newsletterId, subject }: { newsletterId: string; subject?: string }) =>
      api.post<SendEmailResponse>(`/newsletters/${newsletterId}/send-email`, { subject }),
    onSuccess: (data) => {
      toast({
        title: data.failed && data.failed > 0 ? "Emails partially sent" : "Emails sent",
        description: data.message,
      });
      setSendEmailDialogOpen(false);
      setSelectedNewsletter(null);
      setEmailSubject("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send emails",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (newsletter: PublishedNewsletter, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNewsletter(newsletter);
    setDeleteDialogOpen(true);
  };

  const handleSendEmailClick = (newsletter: PublishedNewsletter, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedNewsletter(newsletter);
    setEmailSubject(newsletter.title);
    setSendEmailDialogOpen(true);
  };

  const handleCopyLink = (newsletter: PublishedNewsletter, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    const url = getPublicNewsletterUrl(user.id, newsletter.id);
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied", description: "Public link copied to clipboard." });
  };

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

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center cream-gradient px-6">
        <p className="text-destructive mb-2">Failed to load newsletters</p>
        <Link to={`/linked-streams/${id}`} className="text-primary hover:underline">
          Go back to feed
        </Link>
      </div>
    );
  }

  const renderContent = () => {
    if (isLoading) {
      return <NewsletterListSkeleton />;
    }

    if (newsletters && newsletters.length > 0) {
      return (
        <div className="space-y-4">
          <div className="space-y-4 stagger-children">
            {newsletters.map((newsletter) => (
              <NewsletterCard
                key={newsletter.id}
                newsletter={newsletter}
                linkedStreamId={id!}
                onDelete={(e) => handleDeleteClick(newsletter, e)}
                onSendEmail={(e) => handleSendEmailClick(newsletter, e)}
                onCopyLink={(e) => handleCopyLink(newsletter, e)}
              />
            ))}
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevPage}
                disabled={page === 1 || isFetching}
                className="gap-1 rounded-full px-4 h-9 border-border/50 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <span className="text-sm font-medium text-muted-foreground bg-white/30 dark:bg-black/30 px-3 py-1 rounded-full">
                Page {page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextPage}
                disabled={page >= pagination.totalPages || isFetching}
                className="gap-1 rounded-full px-4 h-9 border-border/50 bg-white/50 dark:bg-black/50 backdrop-blur-sm"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      );
    }

    return <EmptyState linkedStreamId={id!} />;
  };

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      {/* Media-style Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to={`/linked-streams/${id}`}
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Link>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
        </div>
      </header>

      <main className="px-6 max-w-7xl mx-auto space-y-8 relative z-10 mt-12">
        {/* Hero Section */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Archive</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
            Published <br />
            <span className="not-italic text-primary">Editions</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md font-serif italic">
            {linkedStream ? `Archive for ${linkedStream.name}` : "View your published newsletters."}
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
           <div className="flex-1 w-full max-w-3xl mx-auto">
            {renderContent()}
           </div>
        </div>
      </main>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Newsletter</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{selectedNewsletter?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => selectedNewsletter && deleteMutation.mutate(selectedNewsletter.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
            <DialogDescription>
              Send "{selectedNewsletter?.title}" to all subscribers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <label className="text-sm font-medium mb-2 block">Email Subject</label>
            <Input
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              placeholder="Newsletter subject line"
              className="h-10"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                selectedNewsletter &&
                sendEmailMutation.mutate({
                  newsletterId: selectedNewsletter.id,
                  subject: emailSubject || undefined,
                })
              }
              disabled={sendEmailMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {sendEmailMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Send to All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface NewsletterCardProps {
  newsletter: PublishedNewsletter;
  linkedStreamId: string;
  onDelete: (e: React.MouseEvent) => void;
  onSendEmail: (e: React.MouseEvent) => void;
  onCopyLink: (e: React.MouseEvent) => void;
}

function NewsletterCard({ newsletter, linkedStreamId, onDelete, onSendEmail, onCopyLink }: NewsletterCardProps) {
  const publishedDate = newsletter.publishedAt
    ? new Date(newsletter.publishedAt)
    : new Date(newsletter.createdAt);

  const itemCount = newsletter._count?.items ?? 0;

  return (
    <div className="group relative">
      <Link
        to={`/linked-streams/${linkedStreamId}/newsletter/${newsletter.id}`}
        className="block"
      >
        <Card className="overflow-hidden border-border/40 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-md shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 rounded-3xl group-hover:-translate-y-1">
          <div className="p-5 flex items-start gap-5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/10 to-orange-500/5 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-500 shadow-inner">
              <FileText className="h-6 w-6 text-primary group-hover:rotate-3 transition-transform" />
            </div>

            <div className="flex-1 min-w-0 pt-1">
              <div className="flex items-center gap-3 mb-1.5 align-baseline">
                <h3 className="font-serif text-lg font-semibold truncate text-foreground/90 group-hover:text-primary transition-colors">
                  {newsletter.title}
                </h3>
                <Badge
                  variant="secondary"
                  className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full"
                >
                  Published
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground/80">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {publishedDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                {itemCount > 0 && (
                  <>
                    <span className="w-1 h-1 rounded-full bg-border" />
                    <span className="flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5" />
                      {itemCount} items
                    </span>
                  </>
                )}
              </div>
            </div>

             <div className="flex items-center gap-1 self-center opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10" onClick={onCopyLink}>
                  <Link2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
               </Button>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-black/5 dark:hover:bg-white/10" asChild onClick={(e) => e.stopPropagation()}>
                  <Link to={`/linked-streams/${linkedStreamId}/newsletter/${newsletter.id}/subscribers`}>
                    <Users className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </Link>
               </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="h-8 w-8 flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-xl p-1">
                    <DropdownMenuItem onClick={onCopyLink} className="rounded-lg cursor-pointer">
                      <Link2 className="h-4 w-4 mr-2" />
                      Copy Link
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={onSendEmail} className="rounded-lg cursor-pointer">
                      <Send className="h-4 w-4 mr-2" />
                      Send to Subscribers
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                       <Link
                        to={`/linked-streams/${linkedStreamId}/newsletter/${newsletter.id}/subscribers`}
                        className="rounded-lg cursor-pointer flex items-center w-full"
                        onClick={(e) => e.stopPropagation()}
                       >
                         <Users className="h-4 w-4 mr-2" />
                         Manage Subscribers
                       </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={onDelete}
                      className="text-red-600 dark:text-red-400 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20 rounded-lg cursor-pointer"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Edition
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
             </div>
          </div>
        </Card>
      </Link>
    </div>
  );
}

function NewsletterListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="rounded-3xl border border-border/40 bg-white/40 dark:bg-black/20 p-5 flex items-start gap-5">
          <Skeleton className="w-14 h-14 rounded-2xl flex-shrink-0" />
          <div className="flex-1 space-y-2 py-1">
            <Skeleton className="h-6 w-1/3 rounded-lg" />
            <Skeleton className="h-4 w-1/4 rounded-lg opacity-60" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ linkedStreamId }: { linkedStreamId: string }) {
  return (
    <div className="text-center py-20 px-6 rounded-[2rem] border-2 border-dashed border-border/30 bg-white/30 dark:bg-black/10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary/10 to-primary/5 shadow-xl shadow-primary/5 mb-6 ring-1 ring-white/20">
        <Inbox className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="font-serif text-2xl font-medium mb-3 text-foreground/90">No published editions</h3>
      <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
        Your published newsletters will appear here. Create your first edition from the feed!
      </p>
      <Button asChild size="lg" className="rounded-xl shadow-lg shadow-primary/20 hover:scale-105 transition-transform font-bold tracking-wide">
        <Link to={`/linked-streams/${linkedStreamId}`}>Go to Feed</Link>
      </Button>
    </div>
  );
}
