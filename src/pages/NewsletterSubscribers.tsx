import { useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
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
  ArrowLeft,
  Users,
  Mail,
  Trash2,
  Send,
  Search,
  Loader2,
  UserX,
  Download,
} from "lucide-react";
import type { Newsletter } from "../../../milkly-backend/src/types";

interface Subscriber {
  id: string;
  email: string;
  confirmed: boolean;
  createdAt: string;
}

interface SendEmailResponse {
  message: string;
  subject: string;
  subscriberCount: number;
  successful?: number;
  failed?: number;
}

export default function NewsletterSubscribers() {
  const { id: streamId, newsletterId } = useParams<{ id: string; newsletterId: string }>();
  const location = useLocation();
  const isLinkedStream = location.pathname.startsWith("/linked-streams");
  const backPath = isLinkedStream
    ? `/linked-streams/${streamId}/newsletter/${newsletterId}`
    : `/streams/${streamId}/newsletter/${newsletterId}`;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Fetch newsletter details
  const { data: newsletter, isLoading: loadingNewsletter } = useQuery({
    queryKey: ["newsletter", newsletterId],
    queryFn: () => api.get<Newsletter>(`/newsletters/${newsletterId}`),
    enabled: !!newsletterId,
  });

  // Fetch subscribers
  const { data: subscribers, isLoading: loadingSubscribers } = useQuery({
    queryKey: ["newsletter", newsletterId, "subscribers"],
    queryFn: () => api.get<Subscriber[]>(`/newsletters/${newsletterId}/subscribers`),
    enabled: !!newsletterId,
  });

  // Delete subscriber mutation
  const deleteMutation = useMutation({
    mutationFn: (subscriberId: string) =>
      api.delete(`/newsletters/${newsletterId}/subscribers/${subscriberId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["newsletter", newsletterId, "subscribers"] });
      toast({ title: "Subscriber removed" });
      setDeleteConfirm(null);
    },
    onError: () => {
      toast({ title: "Failed to remove subscriber", variant: "destructive" });
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (subject?: string) =>
      api.post<SendEmailResponse>(`/newsletters/${newsletterId}/send-email`, { subject }),
    onSuccess: (data) => {
      toast({
        title: data.failed && data.failed > 0 ? "Emails partially sent" : "Emails sent",
        description: data.message,
      });
      setSendDialogOpen(false);
      setEmailSubject("");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send emails", description: error.message, variant: "destructive" });
    },
  });

  const isLoading = loadingNewsletter || loadingSubscribers;

  const filteredSubscribers = subscribers?.filter((s) =>
    s.email.toLowerCase().includes(search.toLowerCase())
  ) ?? [];

  const handleExport = () => {
    if (!subscribers?.length) return;
    const csv = ["email,subscribed_at,confirmed"]
      .concat(
        subscribers.map(
          (s) => `${s.email},${new Date(s.createdAt).toISOString()},${s.confirmed}`
        )
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${newsletterId}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen cream-gradient safe-area-top safe-area-bottom">
        <header className="sticky top-0 z-40 glass border-b border-border/50 h-14" />
        <main className="px-4 py-8 max-w-7xl mx-auto">
          <div className="space-y-4 max-w-2xl mx-auto">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  const renderContent = () => {
    if (filteredSubscribers.length > 0) {
      return (
        <div className="space-y-3 stagger-children">
          {filteredSubscribers.map((subscriber) => (
            <div
              key={subscriber.id}
              className="group bg-white/60 dark:bg-black/20 hover:bg-white/80 dark:hover:bg-black/40 backdrop-blur-sm p-4 rounded-2xl border border-border/30 hover:border-primary/20 transition-all duration-300 flex items-center justify-between gap-4 shadow-sm hover:shadow-md"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center flex-shrink-0 border border-white/10">
                  <Mail className="h-5 w-5 text-foreground/70 group-hover:text-primary transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate text-foreground group-hover:text-primary/90 transition-colors">
                    {subscriber.email}
                  </p>
                  <p className="text-xs text-muted-foreground/80 flex items-center gap-2">
                    <span>Joined {new Date(subscriber.createdAt).toLocaleDateString()}</span>
                    {subscriber.confirmed && (
                      <span className="inline-flex items-center text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 rounded-sm">
                        Confirmed
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-200"
                onClick={() => setDeleteConfirm(subscriber.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      );
    }

    if (subscribers && subscribers.length > 0) {
      return (
        <div className="text-center py-20 bg-white/20 dark:bg-black/20 rounded-[2rem] border-2 border-dashed border-border/30">
          <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No subscribers match your search</p>
        </div>
      );
    }

    return (
      <div className="text-center py-24 px-6 rounded-[2rem] border-2 border-dashed border-border/30 bg-white/30 dark:bg-black/10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-indigo-500/10 to-purple-500/5 shadow-xl shadow-indigo-500/5 mb-6 ring-1 ring-white/20">
          <UserX className="h-10 w-10 text-muted-foreground" />
        </div>
        <h3 className="font-serif text-2xl font-medium mb-3 text-foreground/90">No subscribers yet</h3>
        <p className="text-muted-foreground mb-8 max-w-xs mx-auto leading-relaxed text-sm">
          Share your newsletter's public link to start building your audience.
        </p>
        <Button asChild size="lg" variant="outline" className="rounded-xl border-border/50 bg-white/50 backdrop-blur-sm">
          <Link to={backPath}>
            Go back to Edition
          </Link>
        </Button>
      </div>
    );
  };

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      {/* Media-style Header */}
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to={backPath}
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
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">Community</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
            Newsletter <br />
            <span className="not-italic text-primary">Subscribers</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md font-serif italic">
            {newsletter?.title ? `Manage audience for "${newsletter.title}"` : "Manage your newsletter subscribers."}
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-3xl mx-auto">
          {/* Actions & Stats */}
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white/60 dark:bg-black/40 backdrop-blur-md rounded-2xl p-4 border border-border/30">
            <div className="relative w-full sm:w-auto flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search subscribers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white/40 dark:bg-black/40 border-border/50 focus:bg-background/80 transition-colors"
                glass
              />
            </div>
            
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Badge variant="secondary" className="h-10 px-3 rounded-xl bg-primary/5 text-primary border border-primary/10">
                <Users className="h-4 w-4 mr-2" />
                <span className="font-bold">{subscribers?.length || 0}</span>
                <span className="ml-1 opacity-70 font-normal">Total</span>
              </Badge>

              <div className="h-6 w-px bg-border/40 mx-1 hidden sm:block" />

              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={!subscribers?.length}
                className="h-10 rounded-xl border-border/50 bg-white/40 dark:bg-black/40 hover:bg-white/60"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setEmailSubject(newsletter?.title || "");
                  setSendDialogOpen(true);
                }}
                disabled={!subscribers?.length || newsletter?.status !== "published"}
                className="h-10 rounded-xl bg-primary shadow-lg shadow-primary/20 hover:bg-primary/90"
              >
                <Send className="h-4 w-4 mr-2" />
                Send Email
              </Button>
            </div>
          </div>

          {/* Subscribers List */}
          {renderContent()}
        </div>
      </main>

      {/* Send Email Dialog */}
      <Dialog open={sendDialogOpen} onOpenChange={setSendDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Newsletter</DialogTitle>
            <DialogDescription>
              Send this newsletter to {subscribers?.length || 0} subscriber{subscribers?.length !== 1 ? "s" : ""}.
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
            <Button variant="outline" onClick={() => setSendDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate(emailSubject || undefined)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Subscriber</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this subscriber? They will no longer receive emails from this newsletter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && deleteMutation.mutate(deleteConfirm)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
