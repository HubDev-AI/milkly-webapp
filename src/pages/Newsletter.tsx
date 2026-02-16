import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { TemplateSettings } from "@/components/template/TemplateSettings";
import { AddCustomItemDialog } from "@/components/AddCustomItemDialog";
import { NewsletterEditorUI } from "@/components/newsletter/NewsletterEditorUI";
import { getLocalStorageKey } from "@/hooks/useNewsletterLocalStorage";
import { useNewsletterEditor } from "@/hooks/useNewsletterEditor";
import { Settings2, Plus } from "lucide-react";

export default function NewsletterPage() {
  const { id: streamId, newsletterId } = useParams<{ id: string; newsletterId: string }>();

  const editor = useNewsletterEditor({
    parentType: "stream",
    parentId: streamId!,
    newsletterId: newsletterId!,
    endpoints: {
      parent: `/streams/${streamId}`,
      templates: `/streams/${streamId}/templates`,
      newsletter: `/newsletters/${newsletterId}`,
      feed: `/streams/${streamId}/feed`,
      createNewsletter: `/streams/${streamId}/newsletters`,
      generateTemplate: `/streams/${streamId}/templates`,
      generateNotes: `/newsletters/generate-notes-from-items`,
      generatePreview: `/newsletters/preview`,
    },
    queryKeys: {
      parent: ["streams", streamId!],
      templates: ["streams", streamId!, "templates"],
      newsletter: ["newsletters", newsletterId!],
      newsletters: ["streams", streamId!, "newsletters"],
      newslettersDrafts: ["streams", streamId!, "newsletters", "drafts"],
      feed: ["streams", streamId!, "feed"],
    },
    getStorageKey: getLocalStorageKey,
    navigationPath: `/streams/${streamId}`,
  });

  const [templateSettingsOpen, setTemplateSettingsOpen] = useState(false);

  return (
    <NewsletterEditorUI
      editor={editor}
      streamType="stream"
      parentId={streamId!}
      newsletterId={newsletterId!}
      templateSettingsSlot={
        <TemplateSettings
          streamId={streamId!}
          streamName={editor.parentData?.name ?? ""}
          open={templateSettingsOpen}
          onOpenChange={setTemplateSettingsOpen}
        >
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Settings2 className="h-4 w-4" />
          </Button>
        </TemplateSettings>
      }
      addCustomItemSlot={
        <AddCustomItemDialog
          streamId={streamId!}
          onItemCreated={editor.handleCustomItemCreated}
        >
          <Button variant="outline" size="sm" className="gap-1 h-8 text-xs">
            <Plus className="h-3 w-3" />
            Add Custom Item
          </Button>
        </AddCustomItemDialog>
      }
    />
  );
}
