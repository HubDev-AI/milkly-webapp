import { memo } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import {
  ClassicEditor,
  Essentials,
  Paragraph,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading,
  Link,
  List,
  Image,
  ImageCaption,
  ImageResize,
  ImageStyle,
  ImageToolbar,
  ImageUpload,
  Base64UploadAdapter,
  Table,
  TableToolbar,
  TableProperties,
  TableCellProperties,
  MediaEmbed,
  BlockQuote,
  Indent,
  IndentBlock,
  Alignment,
  Font,
  HorizontalLine,
  SourceEditing,
  GeneralHtmlSupport,
  FullPage,
  HtmlEmbed,
} from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { cn } from "@/lib/Utils";

interface NewsletterBlockEditorProps {
  initialHtml?: string;
  onHtmlChange?: (html: string) => void;
  readOnly?: boolean;
  className?: string;
}

function NewsletterBlockEditorComponent({
  initialHtml = "",
  onHtmlChange,
  readOnly = false,
  className,
}: NewsletterBlockEditorProps) {
  return (
    <div
      className={cn(
        "newsletter-editor",
        "min-h-[400px] rounded-lg border border-border bg-card overflow-hidden",
        "[&_.ck-editor__editable]:h-[calc(100vh-280px)]",
        "[&_.ck-editor__editable]:min-h-[400px]",
        "[&_.ck-editor__editable]:overflow-auto",
        "[&_.ck.ck-editor__main>.ck-editor__editable]:bg-background",
        "[&_.ck.ck-toolbar]:bg-muted",
        "[&_.ck.ck-toolbar]:border-border",
        "[&_.ck.ck-sticky-panel__content_sticky]:!bg-muted",
        // Dark mode improvements for toolbar visibility
        "dark:[&_.ck.ck-toolbar]:bg-zinc-900",
        "dark:[&_.ck.ck-toolbar]:border-white/10",
        "dark:[&_.ck.ck-button]:text-zinc-400",
        "dark:[&_.ck.ck-button:hover]:bg-zinc-800",
        "dark:[&_.ck.ck-button:hover]:text-white",
        "dark:[&_.ck.ck-button.ck-on]:bg-primary/20",
        "dark:[&_.ck.ck-button.ck-on]:text-primary",
        "dark:[&_.ck.ck-button.ck-on:hover]:bg-primary/30",
        "dark:[&_.ck.ck-toolbar__separator]:bg-white/10",
        "dark:[&_.ck.ck-splitbutton__arrow]:border-l-white/10",
        "dark:[&_.ck.ck-input]:bg-zinc-950",
        "dark:[&_.ck.ck-input]:text-white",
        "dark:[&_.ck.ck-dropdown__panel]:bg-zinc-900",
        "dark:[&_.ck.ck-dropdown__panel]:border-white/10",
        "dark:[&_.ck.ck-list]:bg-zinc-900",
        "dark:[&_.ck.ck-list__item_focusable:hover]:bg-zinc-800",
        // Source editing mode fixes
        // Source editing mode fixes - using !important to override inline/default styles
        "dark:[&_.ck-source-editing-area_textarea]:!bg-zinc-950",
        "dark:[&_.ck-source-editing-area_textarea]:!text-zinc-50",
        "dark:[&_.ck-source-editing-area_textarea]:!border-white/10",
        "dark:[&_.ck-source-editing-area_textarea]:font-mono",
        className
      )}
    >
      <CKEditor
        editor={ClassicEditor}
        data={initialHtml}
        disabled={readOnly}
        onChange={(_event, editor) => {
          const data = editor.getData();
          if (onHtmlChange) {
            onHtmlChange(data);
          }
        }}
        config={{
          licenseKey: "GPL",
          plugins: [
            Essentials,
            Paragraph,
            Bold,
            Italic,
            Underline,
            Strikethrough,
            Heading,
            Link,
            List,
            Image,
            ImageCaption,
            ImageResize,
            ImageStyle,
            ImageToolbar,
            ImageUpload,
            Base64UploadAdapter,
            Table,
            TableToolbar,
            TableProperties,
            TableCellProperties,
            MediaEmbed,
            BlockQuote,
            Indent,
            IndentBlock,
            Alignment,
            Font,
            HorizontalLine,
            SourceEditing,
            GeneralHtmlSupport,
            FullPage,
            HtmlEmbed,
          ],
          toolbar: {
            items: [
              "undo",
              "redo",
              "|",
              "sourceEditing",
              "|",
              "heading",
              "|",
              "bold",
              "italic",
              "underline",
              "strikethrough",
              "|",
              "fontSize",
              "fontFamily",
              "fontColor",
              "fontBackgroundColor",
              "|",
              "alignment",
              "|",
              "link",
              "insertImage",
              "mediaEmbed",
              "insertTable",
              "blockQuote",
              "htmlEmbed",
              "|",
              "bulletedList",
              "numberedList",
              "outdent",
              "indent",
              "|",
              "horizontalLine",
            ],
            shouldNotGroupWhenFull: false,
          },
          heading: {
            options: [
              {
                model: "paragraph",
                title: "Paragraph",
                class: "ck-heading_paragraph",
              },
              {
                model: "heading1",
                view: "h1",
                title: "Heading 1",
                class: "ck-heading_heading1",
              },
              {
                model: "heading2",
                view: "h2",
                title: "Heading 2",
                class: "ck-heading_heading2",
              },
              {
                model: "heading3",
                view: "h3",
                title: "Heading 3",
                class: "ck-heading_heading3",
              },
            ],
          },
          image: {
            toolbar: [
              "imageStyle:inline",
              "imageStyle:block",
              "imageStyle:side",
              "|",
              "toggleImageCaption",
              "imageTextAlternative",
              "|",
              "resizeImage",
            ],
            resizeOptions: [
              { name: "resizeImage:original", value: null, label: "Original" },
              { name: "resizeImage:25", value: "25", label: "25%" },
              { name: "resizeImage:50", value: "50", label: "50%" },
              { name: "resizeImage:75", value: "75", label: "75%" },
            ],
          },
          table: {
            contentToolbar: [
              "tableColumn",
              "tableRow",
              "mergeTableCells",
              "tableProperties",
              "tableCellProperties",
            ],
          },
          link: {
            addTargetToExternalLinks: true,
            defaultProtocol: "https://",
          },
          htmlSupport: {
            allow: [
              {
                name: /.*/,
                attributes: true,
                classes: true,
                styles: true,
              },
            ],
          },
        }}
      />
    </div>
  );
}

export const NewsletterBlockEditor = memo(NewsletterBlockEditorComponent);
