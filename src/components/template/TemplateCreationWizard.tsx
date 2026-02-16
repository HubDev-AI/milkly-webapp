import { GlassCard } from "@/components/ui/GlassCard";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Switch } from "@/components/ui/Switch";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { ImageInput } from "@/components/ImageInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Sparkles, Target, MessageSquare, MousePointer2 } from "lucide-react";
import { TONES, NEWSLETTER_TYPES } from "@/lib/SharedTemplateConstants";
import type { TemplateCustomization } from "../../../../milkly-backend/src/types";

interface TemplateCreationWizardProps {
  name: string;
  setName: (name: string) => void;
  generateWithAI: boolean;
  setGenerateWithAI: (checked: boolean) => void;
  customization: TemplateCustomization;
  setCustomization: (customization: TemplateCustomization) => void;
}

export function TemplateCreationWizard({
  name,
  setName,
  generateWithAI,
  setGenerateWithAI,
  customization,
  setCustomization,
}: TemplateCreationWizardProps) {
  const updateField = <K extends keyof TemplateCustomization>(
    field: K,
    value: TemplateCustomization[K]
  ) => {
    setCustomization({ ...customization, [field]: value });
  };

  return (
    <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr,450px] gap-10 h-full">
      {/* Left Pane: Structural & Orchestration */}
      <div className="h-full overflow-y-auto px-10 -mx-10 pb-12" style={{ scrollbarWidth: "none" }}>
        <div className="py-2 space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-bold tracking-[0.3em] text-primary/70 uppercase pl-1 block italic">
              Structural Composition
            </label>
            <GlassCard className="p-8 bg-white/40 border-primary/10 shadow-sm overflow-visible relative">
              <div className="space-y-12">
                <div className="space-y-4">
                  <Label
                    htmlFor="name"
                    className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1"
                  >
                    Blueprint Identity
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., The Weekly Curator"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 focus:border-primary/40 transition-all font-sans text-base shadow-sm px-4 text-foreground font-medium placeholder:text-muted-foreground/50"
                  />
                  <p className="text-[10px] text-muted-foreground italic ml-1 opacity-70 font-medium">
                    Omit to let AI conceptualize a fitting title.
                  </p>
                </div>

                <div className="relative group overflow-hidden p-6 rounded-2xl bg-primary/5 border border-primary/10 hover:border-primary/20 transition-all shadow-sm hover:shadow-md">
                  <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity">
                    <Sparkles className="h-10 w-10 text-primary" />
                  </div>
                  <div className="relative z-10 flex items-center justify-between gap-6">
                    <div className="flex-1">
                      <Label
                        htmlFor="generateWithAI"
                        className="text-base font-bold text-foreground cursor-pointer flex items-center gap-2"
                      >
                        AI Orchestration
                        <Badge
                          variant="outline"
                          className="text-[9px] bg-primary/10 border-primary/20 text-primary tracking-widest font-bold"
                        >
                          ALPHA
                        </Badge>
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium leading-relaxed max-w-sm">
                        Synthesize template structure and aesthetic through our
                        neural engine for an editorial-first result.
                      </p>
                    </div>
                    <Switch
                      id="generateWithAI"
                      checked={generateWithAI}
                      onCheckedChange={setGenerateWithAI}
                      className="data-[state=checked]:bg-primary h-7 w-12"
                    />
                  </div>
                </div>

                {generateWithAI && (
                  <div className="grid grid-cols-2 gap-6 pt-2 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-3 text-left">
                      <Label className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1 block">
                        Newsletter Archetype
                      </Label>
                      <Select
                        value={customization.newsletterType || "digest"}
                        onValueChange={(val) =>
                          updateField("newsletterType", val as any)
                        }
                      >
                        <SelectTrigger className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 shadow-sm font-sans text-sm px-4 text-foreground font-medium">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-3xl border-primary/10 rounded-2xl">
                          {NEWSLETTER_TYPES.map((type) => (
                            <SelectItem
                              key={type.id}
                              value={type.id}
                              className="font-sans py-3 focus:bg-primary/5 cursor-pointer"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-bold">{type.name}</span>
                                <span className="text-[10px] opacity-60">
                                  {type.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3 text-left">
                      <Label className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1 block">
                        Editorial Tone
                      </Label>
                      <Select
                        value={customization.tone || "professional"}
                        onValueChange={(val) => updateField("tone", val as any)}
                      >
                        <SelectTrigger className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 shadow-sm font-sans text-sm px-4 text-foreground font-medium">
                          <SelectValue placeholder="Select tone" />
                        </SelectTrigger>
                        <SelectContent className="bg-background/95 backdrop-blur-3xl border-primary/10 rounded-2xl">
                          {TONES.map((tone) => (
                            <SelectItem
                              key={tone.id}
                              value={tone.id}
                              className="font-sans py-3 focus:bg-primary/5 cursor-pointer"
                            >
                              <div className="flex flex-col text-left">
                                <span className="font-bold">{tone.name}</span>
                                <span className="text-[10px] opacity-60">
                                  {tone.description}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </GlassCard>
          </div>

          {generateWithAI && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <label className="text-[10px] font-bold tracking-[0.3em] text-primary/70 uppercase pl-1 block italic">
                Content Orchestration
              </label>
              <GlassCard className="p-8 space-y-6 bg-white/40 border-primary/10 shadow-sm overflow-visible">
                <div className="grid gap-6">
                  <div className="space-y-3">
                    <Label
                      htmlFor="tagline"
                      className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1 block flex items-center gap-2"
                    >
                      <Target className="h-3 w-3" /> Core Tagline
                    </Label>
                    <Input
                      id="tagline"
                      placeholder="e.g., Decrypting the frontier of AI."
                      value={customization.tagline || ""}
                      onChange={(e) => updateField("tagline", e.target.value)}
                      className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 font-sans text-sm px-4 flex items-center"
                    />
                  </div>
                  <div className="space-y-3">
                    <Label
                      htmlFor="description"
                      className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1 block flex items-center gap-2"
                    >
                      <MessageSquare className="h-3 w-3" /> Mission Statement
                    </Label>
                    <Textarea
                      id="description"
                      placeholder="Describe the editorial soul of this blueprint..."
                      value={customization.description || ""}
                      onChange={(e) => updateField("description", e.target.value)}
                      className="min-h-[100px] bg-white/5 border-primary/30 rounded-xl focus:ring-primary/20 font-sans text-sm p-4 resize-none"
                    />
                  </div>
                  <div className="space-y-3 pt-2">
                    <Label
                      htmlFor="customPrompt"
                      className="text-[11px] font-bold tracking-widest text-primary/60 uppercase ml-1 block flex items-center gap-2"
                    >
                      <Sparkles className="h-3 w-3" /> Neural Guidance
                    </Label>
                    <Textarea
                      id="customPrompt"
                      placeholder="Add specific constraints or style rules for the AI..."
                      value={customization.customPrompt || ""}
                      onChange={(e) => updateField("customPrompt", e.target.value)}
                      className="min-h-[80px] bg-primary/[0.02] border-primary/10 rounded-xl focus:ring-primary/20 font-sans text-xs p-4 italic"
                    />
                  </div>
                </div>
              </GlassCard>
            </div>
          )}
        </div>
      </div>

      {/* Right Pane: Visual Forecast & Aesthetic */}
      <div className="h-full overflow-y-auto px-10 -mx-10 custom-scrollbar pb-12">
        <div className="py-2 space-y-10">
          <div className="space-y-4">
            <div className="px-1 flex items-center justify-between">
              <label className="text-[10px] font-bold tracking-[0.3em] text-primary/70 uppercase italic">
                Visual Forecast
              </label>
              <div className="text-[9px] font-serif italic text-primary/60 uppercase tracking-widest">
                Real-time simulation
              </div>
            </div>

            <GlassCard className="bg-white/20 border-primary/10 overflow-hidden relative group p-8 shadow-sm flex flex-col items-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(var(--primary),0.05),transparent)] pointer-events-none" />

              <div className="flex items-center justify-center w-full">
                <div className="w-full max-w-[240px] aspect-[4/5] rounded-[2rem] bg-white shadow-2xl overflow-hidden border border-primary/10 relative transform group-hover:scale-[1.02] transition-transform duration-700 mx-auto">
                  <div
                    className="h-20 w-full p-4 flex flex-col justify-end gap-1"
                    style={{ backgroundColor: customization.primaryColor }}
                  >
                    <div className="w-8 h-1 bg-white/20 rounded-full" />
                  </div>

                  <div className="p-4 space-y-3">
                    <div className="space-y-1.5">
                      <div className="w-full h-1 bg-primary/10 rounded-full" />
                      <div className="w-5/6 h-1 bg-primary/10 rounded-full" />
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="aspect-square rounded-lg bg-primary/5 border border-primary/5 p-2 flex flex-col justify-center gap-1">
                        <div className="w-full h-1 bg-primary/10 rounded-full" />
                      </div>
                      <div
                        className="aspect-square rounded-lg bg-primary/5 border border-primary/5 p-2 flex flex-col justify-center gap-1"
                        style={{ borderColor: `${customization.accentColor}20` }}
                      >
                        <div
                          className="w-full h-2 rounded-md"
                          style={{
                            backgroundColor: `${customization.accentColor}20`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div
                    className="absolute bottom-4 inset-x-4 h-6 rounded-lg flex items-center justify-center shadow-md transition-colors border border-primary/10"
                    style={{ backgroundColor: customization.accentColor }}
                  >
                    <div className="w-10 h-1 bg-white/50 rounded-full" />
                  </div>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-center gap-10 border-t border-primary/5 pt-6 w-full">
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm border border-black/5"
                    style={{ backgroundColor: customization.primaryColor }}
                  />
                  <span className="text-[9px] font-bold text-primary/50 uppercase tracking-[0.2em]">
                    Primary
                  </span>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full shadow-sm border border-black/5"
                    style={{ backgroundColor: customization.accentColor }}
                  />
                  <span className="text-[9px] font-bold text-primary/50 uppercase tracking-[0.2em]">
                    Accent
                  </span>
                </div>
              </div>
            </GlassCard>
          </div>

          <div className="space-y-4 animate-in fade-in duration-1000">
            <label className="text-[10px] font-bold tracking-[0.3em] text-primary/70 uppercase pl-1 block italic">
              Aesthetic Definition
            </label>
            <GlassCard className="p-8 space-y-8 bg-white/40 border-primary/10 shadow-sm overflow-visible">
              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[11px] font-bold tracking-widest text-primary/60 uppercase block px-1">
                    Chromatic Identity
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative group p-1 rounded-2xl bg-white/5 border border-primary/20 overflow-hidden shadow-sm flex items-center gap-3 pr-4 hover:border-primary/40 transition-colors">
                      <div className="relative w-11 h-11">
                        <input
                          type="color"
                          value={customization.primaryColor}
                          onChange={(e) =>
                            updateField("primaryColor", e.target.value)
                          }
                          className="w-full h-full rounded-xl cursor-pointer opacity-0 absolute inset-0 z-10"
                        />
                        <div
                          className="w-full h-full rounded-xl shadow-inner border border-black/5"
                          style={{
                            backgroundColor: customization.primaryColor,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground/70">
                        {customization.primaryColor}
                      </span>
                    </div>
                    <div className="relative group p-1 rounded-2xl bg-white/5 border border-primary/20 overflow-hidden shadow-sm flex items-center gap-3 pr-4 hover:border-primary/40 transition-colors">
                      <div className="relative w-11 h-11">
                        <input
                          type="color"
                          value={customization.accentColor}
                          onChange={(e) =>
                            updateField("accentColor", e.target.value)
                          }
                          className="w-full h-full rounded-xl cursor-pointer opacity-0 absolute inset-0 z-10"
                        />
                        <div
                          className="w-full h-full rounded-xl shadow-inner border border-black/5"
                          style={{
                            backgroundColor: customization.accentColor,
                          }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold tracking-widest uppercase text-foreground/70">
                        {customization.accentColor}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                <div className="space-y-3 px-1">
                  <ImageInput
                    value={customization.logoUrl || ""}
                    onChange={(url) => updateField("logoUrl", url || undefined)}
                    label="Core Logo"
                  />
                </div>

                <div className="h-px w-full bg-gradient-to-r from-transparent via-primary/10 to-transparent" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <Label
                      htmlFor="includeCta"
                      className="text-[11px] font-bold tracking-widest text-primary/60 uppercase flex items-center gap-2"
                    >
                      <MousePointer2 className="h-3.5 w-3.5" /> Engagement Layer
                    </Label>
                    <Switch
                      id="includeCta"
                      checked={customization.includeFooterCTA ?? true}
                      onCheckedChange={(v) => updateField("includeFooterCTA", v)}
                      className="data-[state=checked]:bg-primary"
                    />
                  </div>
                  {customization.includeFooterCTA && (
                    <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                      <Input
                        placeholder="CTA Text: e.g., Subscribe for more insights"
                        value={customization.footerCTAText || ""}
                        onChange={(e) =>
                          updateField("footerCTAText", e.target.value)
                        }
                        className="bg-white/5 border-primary/30 h-11 rounded-xl focus:ring-primary/20 font-sans text-sm px-4"
                      />
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
}
