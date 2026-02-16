import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { LinkedStreamTemplateSettings } from "@/components/template/LinkedStreamTemplateSettings";
import { AddCustomItemDialog } from "@/components/AddCustomItemDialog";
import { NewsletterEditorUI } from "@/components/newsletter/NewsletterEditorUI";
import { useNewsletterEditor } from "@/hooks/useNewsletterEditor";
import { Settings2, Plus } from "lucide-react";

function getLinkedStreamLocalStorageKey(linkedStreamId: string, newsletterId: string) {
  return `linked-stream-newsletter-draft-${linkedStreamId}-${newsletterId}`;
}

function extractItemId(item: { contentItemId?: string; linkedStreamCustomItemId?: string }): string {
  return item.contentItemId || item.linkedStreamCustomItemId || "";
}

export default function LinkedStreamNewsletter() {
  const { id: linkedStreamId, newsletterId } = useParams<{ id: string; newsletterId: string }>();

  const editor = useNewsletterEditor({
    parentType: "linked-stream",
    parentId: linkedStreamId!,
    newsletterId: newsletterId!,
    endpoints: {
      parent: `/linked-streams/${linkedStreamId}`,
      templates: `/linked-streams/${linkedStreamId}/templates`,
      newsletter: `/linked-newsletters/${newsletterId}`,
      feed: `/linked-streams/${linkedStreamId}/feed`,
      createNewsletter: `/linked-streams/${linkedStreamId}/newsletters`,
      generateTemplate: `/linked-streams/${linkedStreamId}/templates`,
      generateNotes: `/newsletters/generate-notes-from-items`,
      generatePreview: `/newsletters/preview`,
    },
    queryKeys: {
      parent: ["linked-stream", linkedStreamId!],
      templates: ["linked-stream", linkedStreamId!, "templates"],
      newsletter: ["linked-newsletters", newsletterId!],
      newsletters: ["linked-stream", linkedStreamId!, "newsletters"],
      newslettersDrafts: ["linked-stream", linkedStreamId!, "newsletters", "drafts"],
      feed: ["linked-stream", linkedStreamId!, "feed"],
    },
    getStorageKey: getLinkedStreamLocalStorageKey,
    navigationPath: `/linked-streams/${linkedStreamId}`,
    extractItemId,
  });

  const [templateSettingsOpen, setTemplateSettingsOpen] = useState(false);

  return (
    <NewsletterEditorUI
      editor={editor}
      streamType="linkedStream"
      parentId={linkedStreamId!}
      newsletterId={newsletterId!}
      templateSettingsSlot={
        <LinkedStreamTemplateSettings
          linkedStreamId={linkedStreamId!}
          linkedStreamName={editor.parentData?.name ?? ""}
          open={templateSettingsOpen}
          onOpenChange={setTemplateSettingsOpen}
        >
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-foreground">
            <Settings2 className="h-4 w-4" />
          </Button>
        </LinkedStreamTemplateSettings>
      }
      addCustomItemSlot={
        <AddCustomItemDialog
          streamId={linkedStreamId!}
          streamType="linkedStream"
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
