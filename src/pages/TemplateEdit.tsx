import { useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { MilklyLogo } from "@/components/MilklyLogo";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { ArrowLeft } from "lucide-react";
import { api } from "@/lib/Api";
import { useToast } from "@/hooks/useToast";
import { queryKeys } from "@/lib/QueryKeys";
import { VisualTemplateEditor, type VisualTemplateEditorRef } from "@/components/template/VisualTemplateEditor";
import type { Template } from "../../../milkly-backend/src/types";

export default function TemplateEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const editorRef = useRef<VisualTemplateEditorRef>(null);

  const returnUrl = searchParams.get("returnUrl") || "/templates";

  const {
    data: template,
    isLoading,
    error,
  } = useQuery({
    queryKey: queryKeys.templates.detail(id ?? ""),
    queryFn: () => api.get<Template>(`/templates/${id}`),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen cream-gradient safe-area-top safe-area-bottom pt-6">
        <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                to={returnUrl}
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
          <TemplateEditSkeleton />
        </main>
      </div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen cream-gradient safe-area-top safe-area-bottom pt-6">
        <header className="sticky top-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
          <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
            <div className="flex items-center gap-8">
              <Link
                to={returnUrl}
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
          <Card className="cream-card">
            <CardContent className="py-12 text-center">
              <h2 className="text-lg font-semibold mb-2">Template not found</h2>
              <p className="text-sm text-muted-foreground mb-4">
                The template you're looking for doesn't exist or you don't have access to it.
              </p>
              <Button variant="outline" onClick={() => navigate(returnUrl)}>
                Back to Templates
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="h-screen cream-gradient safe-area-top safe-area-bottom flex flex-col overflow-hidden selection:bg-primary/20">
      <header className="flex-shrink-0 z-50 bg-background/40 backdrop-blur-2xl border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Button
              variant="ghost"
              onClick={() => editorRef.current?.requestClose()}
              className="group flex items-center gap-3 text-[10px] font-bold tracking-[0.3em] text-primary/60 hover:text-primary transition-all duration-300 uppercase italic h-auto p-0 hover:bg-transparent"
            >
              <ArrowLeft className="h-3.5 w-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Back</span>
            </Button>
            <div className="h-8 w-px bg-primary/10 rotate-12" />
            <MilklyLogo size="sm" />
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="flex-1 min-h-0 px-4 py-4 md:px-6 md:py-5">
        <div className="h-full rounded-2xl border border-primary/10 overflow-hidden shadow-lg bg-background">
          <VisualTemplateEditor
            ref={editorRef}
            template={template}
            onSave={(savedTemplate) => {
              toast({
                title: "Template saved",
                description: `"${savedTemplate.name}" has been updated.`,
              });
            }}
            onCancel={() => navigate(returnUrl)}
            onClose={() => navigate(returnUrl)}
          />
        </div>
      </main>
    </div>
  );
}

function TemplateEditSkeleton() {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Card className="cream-card">
        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-5 w-20" />
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Card className="cream-card">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-8 w-28" />
          </div>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
