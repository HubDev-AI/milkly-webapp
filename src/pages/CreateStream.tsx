import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/Api";
import { queryKeys } from "@/lib/QueryKeys";
import { cn } from "@/lib/Utils";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Label } from "@/components/ui/Label";
import { Checkbox } from "@/components/ui/Checkbox";
import { Badge } from "@/components/ui/Badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { useToast } from "@/hooks/useToast";
import { useLimitError } from "@/hooks/useLimitError";
import { useSubscription } from "@/hooks/useSubscription";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { ArrowLeft, Loader2, Clock, TrendingUp, Star, X, Sparkles, Plus, Tag, Lock, AlertTriangle, Link2, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/ui/GlassCard";
import type { Stream, Category, CreateStreamInput, UpdateStreamInput, SortOption, TierName } from "../../../milkly-backend/src/types";

const CATEGORY_INFO: Record<Category, { label: string; description: string; minTier: TierName }> = {
  news: { label: "News", description: "Articles and blog posts", minTier: "essential" },
  videos: { label: "Videos", description: "YouTube and video content", minTier: "professional" },
  social: { label: "Social", description: "Twitter, Reddit, and more", minTier: "professional" },
  custom: { label: "Custom", description: "Custom content", minTier: "essential" },
  none: { label: "None", description: "No category", minTier: "essential" },
};

const TIER_LABELS: Record<TierName, string> = {
  essential: "Essential",
  professional: "Professional",
  mastery: "Mastery",
};

const SORT_OPTIONS: { value: SortOption; label: string; description: string; icon: typeof Clock }[] = [
  { value: "relevancy", label: "Relevant", description: "Most relevant to your stream", icon: Star },
  { value: "popularity", label: "Popular", description: "Most popular content first", icon: TrendingUp },
  { value: "date", label: "Latest", description: "Most recent content first", icon: Clock },
];

export default function CreateStream() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [sortPreference, setSortPreference] = useState<SortOption>("relevancy");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");

  const {
    limitError,
    showUpgradePrompt,
    dismissUpgradePrompt,
    handleError: handleLimitError,
    showPromptWithError,
  } = useLimitError();

  const {
    tier: userTier,
    allowedCategories,
    allCategories: allCategoriesFromHook,
    hasExceededGenerateLimit: hasExceededGenerationLimit,
    isCategoryAllowed,
    usage,
    limits,
  } = useSubscription();

  const { data: existingStream, isLoading: isLoadingStream } = useQuery({
    queryKey: ["streams", id],
    queryFn: () => api.get<Stream>(`/streams/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingStream) {
      setName(existingStream.name);
      setDescription(existingStream.description ?? "");
      setSelectedCategories(existingStream.categories);
      setSortPreference(existingStream.sortPreference);
      setKeywords(existingStream.keywords ?? []);
    }
  }, [existingStream]);

  const createMutation = useMutation({
    mutationFn: (data: CreateStreamInput) => api.post<Stream>("/streams", data),
    onSuccess: (newStream) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.all });
      toast({
        title: "Stream created",
        description: `"${newStream.name}" is ready to milk!`,
      });
      navigate(`/streams/${newStream.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to create stream",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateStreamInput) => api.patch<Stream>(`/streams/${id}`, data),
    onSuccess: (updatedStream) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.streams.all });
      if (id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.streams.detail(id) });
      }
      toast({
        title: "Stream updated",
        description: "Your changes have been saved.",
      });
      navigate(`/streams/${updatedStream.id}`);
    },
    onError: (error) => {
      toast({
        title: "Failed to update stream",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      });
    },
  });

  const generateKeywordsMutation = useMutation({
    mutationFn: (data: { name: string; description?: string }) =>
      api.post<{ keywords: string[] }>("/streams/generate-keywords", data),
    onSuccess: (result) => {
      setKeywords(result.keywords);
      queryClient.invalidateQueries({ queryKey: ["subscription"] });
      toast({
        title: "Keywords generated",
        description: `Generated ${result.keywords.length} keywords for your stream.`,
      });
    },
    onError: (error) => {
      if (!handleLimitError(error)) {
        toast({
          title: "Failed to generate keywords",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        });
      }
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isGeneratingKeywords = generateKeywordsMutation.isPending;

  const allCategories = useMemo(() => {
    return allCategoriesFromHook.filter((cat) => cat !== "none");
  }, [allCategoriesFromHook]);

  const isCustomOnly = useMemo(() => {
    return selectedCategories.length === 1 && selectedCategories[0] === "custom";
  }, [selectedCategories]);

  const isCategoryLocked = useCallback(
    (category: Category) => !isCategoryAllowed(category),
    [isCategoryAllowed]
  );

  const isSelectedButLocked = (category: Category) => {
    return selectedCategories.includes(category) && isCategoryLocked(category);
  };

  const getRequiredTier = (category: Category): TierName => {
    return CATEGORY_INFO[category]?.minTier ?? "essential";
  };

  function toggleCategory(category: Category) {
    if (isCategoryLocked(category)) {
      const requiredTier = getRequiredTier(category);
      showPromptWithError({
        code: "FEATURE_LOCKED",
        message: `The ${CATEGORY_INFO[category]?.label} category requires a ${TIER_LABELS[requiredTier]} plan or higher.`,
        limit: "maxStreams",
        current: 0,
        max: 0,
        upgradeUrl: "/pricing",
      });
      return;
    }

    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  }

  function addKeyword() {
    const keyword = newKeyword.trim();
    if (keyword && !keywords.includes(keyword)) {
      setKeywords((prev) => [...prev, keyword]);
      setNewKeyword("");
    }
  }

  function removeKeyword(keywordToRemove: string) {
    setKeywords((prev) => prev.filter((k) => k !== keywordToRemove));
  }

  function handleKeywordKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      addKeyword();
    }
  }

  function handleGenerateKeywords() {
    if (hasExceededGenerationLimit) {
      showPromptWithError({
        code: "LIMIT_EXCEEDED",
        message: "You've used all your AI generations for this week.",
        limit: "generatesPerWeek",
        current: usage?.generateCount ?? 0,
        max: limits?.generatesPerWeek ?? 0,
        upgradeUrl: "/pricing",
      });
      return;
    }

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a stream name first to generate keywords.",
        variant: "destructive",
      });
      return;
    }

    generateKeywordsMutation.mutate({
      name: name.trim(),
      description: description.trim() || undefined,
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for your stream.",
        variant: "destructive",
      });
      return;
    }

    const validCategories = selectedCategories.filter((cat) => allowedCategories.includes(cat));
    const removedCount = selectedCategories.length - validCategories.length;

    if (removedCount > 0) {
      toast({
        title: "Categories updated",
        description: `${removedCount} unavailable ${removedCount === 1 ? "category was" : "categories were"} removed from your selection.`,
      });
      setSelectedCategories(validCategories);
    }

    if (validCategories.length === 0) {
      toast({
        title: "Category required",
        description: "Please select at least one category available on your plan.",
        variant: "destructive",
      });
      return;
    }

    const isCustomOnlyStream = validCategories.length === 1 && validCategories[0] === "custom";

    if (!isCustomOnlyStream && keywords.length === 0) {
      toast({
        title: "Keywords required",
        description: "Please add at least one keyword for content search.",
        variant: "destructive",
      });
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      categories: validCategories,
      sortPreference,
      keywords: isCustomOnlyStream ? [] : keywords,
    };

    if (isEditing) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data as CreateStreamInput);
    }
  }

  if (isEditing && isLoadingStream) {
    return (
      <div className="min-h-screen flex items-center justify-center cream-gradient">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen cream-gradient safe-area-bottom pt-6">
      <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link
              to={isEditing ? `/streams/${id}` : "/"}
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

      <main className="px-6 max-w-xl mx-auto mt-16 md:mt-24">
        <div className="space-y-2 mb-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-px w-8 bg-primary/40" />
            <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary/60 font-mono">{isEditing ? "Configuration" : "Stream Workshop"}</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-serif italic tracking-tight text-foreground leading-[1.1]">
            {isEditing ? "Edit" : "New"} <br />
            <span className="not-italic text-primary">Stream</span>
          </h1>
          <p className="text-base text-muted-foreground max-w-md font-serif italic">
            {isEditing ? "Fine-tune your stream's curation parameters." : "Define a new content feed with curated channels and keywords."}
          </p>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-6"
        >
          {/* Fusion Discovery Bridge */}
          {!isEditing && (
            <GlassCard className="p-4 bg-gradient-to-r from-primary/10 to-transparent border-primary/20 group hover:border-primary/40 transition-all duration-300">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <Link2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-lg font-bold font-serif italic text-foreground leading-tight">Searching for a unified feed?</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1 opacity-70">Try Editorial Fusions to merge multiple streams</p>
                  </div>
                </div>
                <Link to="/linked-streams" state={{ openCreate: true }}>
                  <Button variant="glass" size="sm" className="h-10 px-4 gap-2 text-[10px] font-bold uppercase tracking-widest border-primary/10 hover:border-primary/30">
                    Fusion Mode
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              </div>
            </GlassCard>
          )}

          <GlassCard className="p-6 md:p-8 space-y-8 border-primary/10 shadow-2xl overflow-visible">
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name */}
              <div className="space-y-3">
                <Label htmlFor="name" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">
                  Stream Identity <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., The Tech Daily"
                  disabled={isSubmitting}
                  className="bg-white/5 border-primary/30 h-14 rounded-xl focus:ring-primary/20 focus:border-primary/40 transition-all font-serif text-xl shadow-sm px-4 text-foreground font-medium placeholder:font-sans placeholder:text-sm placeholder:italic placeholder:text-muted-foreground/50"
                  autoFocus
                />
              </div>

              {/* Description */}
              <div className="space-y-3">
                <Label htmlFor="description" className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">
                  Manifesto <span className="text-muted-foreground/50 lowercase tracking-normal">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the curation philosophy of this stream..."
                  disabled={isSubmitting}
                  className="min-h-[120px] bg-white/5 border-primary/30 rounded-xl focus:ring-primary/20 focus:border-primary/40 transition-all font-sans text-base p-4 resize-none shadow-sm text-foreground placeholder:text-muted-foreground/50"
                />
              </div>

              {/* Categories */}
              <div className="space-y-4">
                <Label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">Curated Channels <span className="text-red-500">*</span></Label>
                <div className="grid grid-cols-1 gap-3">
                  {allCategories.map((category) => {
                    const info = CATEGORY_INFO[category];
                    const isLocked = isCategoryLocked(category);
                    const isSelectedLocked = isSelectedButLocked(category);
                    const isSelected = selectedCategories.includes(category);
                    const requiredTier = getRequiredTier(category);

                    return (
                      <label
                        key={category}
                        className={cn(
                          "flex items-start gap-4 p-5 rounded-2xl cursor-pointer border transition-colors duration-200",
                          isLocked && !isSelectedLocked && "opacity-60 border-primary/10 bg-primary/5 hover:bg-primary/10",
                          isSelectedLocked && "border-amber-500/50 bg-amber-500/10",
                          !isLocked && isSelected && "bg-primary/10 border-primary/30",
                          !isLocked && !isSelected && "border-primary/10 bg-primary/5 hover:border-primary/20 hover:bg-primary/10"
                        )}
                        onClick={(e) => {
                          if (isLocked) {
                            e.preventDefault();
                            toggleCategory(category);
                          }
                        }}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleCategory(category)}
                          disabled={isSubmitting || (isLocked && !isSelectedLocked)}
                          className={cn("mt-1.5 w-5 h-5", isSelectedLocked && "border-amber-500")}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 flex-wrap">
                            <span className={cn(
                              "text-lg font-serif font-medium", 
                              isLocked && !isSelectedLocked && "text-muted-foreground", 
                              isSelectedLocked && "line-through text-amber-600",
                              isSelected && "text-primary"
                            )}>
                              {info?.label ?? category}
                            </span>
                            {isLocked && (
                              <Badge
                                variant="glass"
                                className={cn(
                                  "text-[9px] uppercase tracking-widest gap-1 py-0.5 px-2 font-black",
                                  isSelectedLocked
                                    ? "bg-amber-500/20 text-amber-500 border-amber-500/40"
                                    : "bg-white/10 text-muted-foreground border-white/5"
                                )}
                              >
                                <Lock className="h-3 w-3" />
                                {TIER_LABELS[requiredTier]}
                              </Badge>
                            )}
                          </div>
                          <p className={cn("text-xs mt-1 leading-relaxed", isLocked ? "text-muted-foreground/60" : "text-muted-foreground")}>
                            {info?.description ?? ""}
                          </p>
                          {isSelectedLocked && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              This category is no longer available on your plan.
                            </p>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-full liquid-glass border-none w-fit">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  <p className="text-[10px] uppercase font-black tracking-widest text-muted-foreground">
                    Plan: <span className="text-primary">{TIER_LABELS[userTier]}</span>
                    {userTier === "essential" && <span className="opacity-50 ml-2">(Standard Milking)</span>}
                  </p>
                </div>
              </div>

              {!isCustomOnly && (
                <div className="space-y-4 pt-4 border-t border-white/5">
                  <div>
                    <Label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" />
                      Curation Keywords <span className="text-red-500">*</span>
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1 font-serif italic opacity-70">
                      The linguistic filters used to distill your feed
                    </p>
                  </div>

                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword) => (
                        <Badge
                          key={keyword}
                          variant="glass"
                          className="pl-3 pr-1.5 py-1.5 text-xs flex items-center gap-2 border-primary/20 text-primary font-medium"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            disabled={isSubmitting}
                            className="w-5 h-5 flex items-center justify-center hover:bg-primary/20 rounded-full transition-colors"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      placeholder="Refinement term..."
                      disabled={isSubmitting}
                      className="flex-1 h-12 bg-white/5 border-primary/30 rounded-xl focus:ring-primary/20 focus:border-primary/40 transition-all shadow-sm text-foreground placeholder:text-muted-foreground/50"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addKeyword}
                      disabled={isSubmitting || !newKeyword.trim()}
                      className="h-12 w-12 p-0 rounded-xl bg-white/5 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all"
                    >
                      <Plus className="h-5 w-5" />
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateKeywords}
                    disabled={isSubmitting || isGeneratingKeywords || !name.trim()}
                    className="group relative overflow-hidden gap-2 w-full h-11 border border-primary/20 hover:border-primary/40 transition-all duration-300"
                  >
                    <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isGeneratingKeywords ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Synthesizing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 text-primary group-hover:text-amber-400 group-hover:scale-125 transition-all duration-300" />
                        <span className="text-[10px] uppercase font-bold tracking-widest">Generate Keywords with AI</span>
                        {hasExceededGenerationLimit && (
                          <span className="text-amber-500 ml-1">•</span>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              )}

              {!isCustomOnly && (
                <div className="space-y-4 pt-2 border-t border-white/5">
                  <Label className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] font-mono">Sort Order</Label>
                  <Select
                    value={sortPreference}
                    onValueChange={(value) => setSortPreference(value as SortOption)}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="bg-white/5 border-primary/30 rounded-xl focus:ring-primary/20 shadow-sm font-serif text-lg px-5 py-10 text-foreground">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent className="bg-background/95 backdrop-blur-3xl border-primary/10 rounded-2xl">
                      {SORT_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <SelectItem key={option.value} value={option.value}>
                            <div className="flex flex-col py-1">
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-primary" />
                                <span className="font-serif text-base">{option.label}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5 opacity-60">{option.description}</span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="pt-6">
                <Button
                  type="submit"
                  variant="glass-premium"
                  disabled={isSubmitting}
                  className="w-full h-16 text-xl font-bold rounded-2xl shadow-xl shadow-primary/10"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                      <span className="uppercase tracking-widest text-sm">Processing...</span>
                    </>
                  ) : isEditing ? (
                    "Save Concept"
                  ) : (
                    "Launch Stream"
                  )}
                </Button>
              </div>
            </form>
          </GlassCard>
        </motion.div>
      </main>

      <UpgradePrompt
        open={showUpgradePrompt}
        onClose={dismissUpgradePrompt}
        limitError={limitError}
      />
    </div>
  );
}
