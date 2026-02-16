import { cn } from "@/lib/Utils";
import { Card } from "@/components/ui/Card";
import { Smartphone, Monitor } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface NewsletterPreviewProps {
  htmlContent: string;
  title?: string;
  className?: string;
  disableLinks?: boolean;
}

// Styles to inject into the iframe for newsletter content
const iframeStyles = `
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
    line-height: 1.6;
    color: #2D2117;
    background: white;
    background: white;
    overflow-y: auto;
  }
  body > *:first-child {
    margin-top: 0;
  }
  body > *:last-child {
    margin-bottom: 0;
  }
  h1 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: #2D2117;
  }
  h2 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.5rem;
    font-weight: 600;
    margin-top: 2rem;
    margin-bottom: 0.75rem;
    color: #3D3117;
  }
  h3 {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 600;
    margin-top: 1.5rem;
    margin-bottom: 0.5rem;
    color: #4D4117;
  }
  p {
    margin-bottom: 1rem;
  }
  a {
    color: #8B6914;
    text-decoration: underline;
  }
  img {
    max-width: 100%;
    height: auto;
    border-radius: 0;
    margin: 1rem 0;
  }
  ul, ol {
    margin-bottom: 1rem;
    padding-left: 1.5rem;
  }
  li {
    margin-bottom: 0.5rem;
  }
  blockquote {
    border-left: 3px solid #D4A574;
    padding-left: 1rem;
    margin: 1rem 0;
    font-style: italic;
    color: #5D5147;
  }
  hr {
    border: none;
    border-top: 1px solid #E8E0D8;
    margin: 2rem 0;
  }
  .section {
    padding: 1.5rem;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, #FDFBF7 0%, #F8F4EE 100%);
    border-radius: 0;
  }
  .item {
    padding: 1rem;
    margin-bottom: 0.75rem;
    background: white;
    border: 1px solid #E8E0D8;
    border-radius: 0;
  }
  .item-image {
    width: 100%;
    height: 160px;
    object-fit: cover;
    border-radius: 0;
    margin-bottom: 0.75rem;
  }
  .item-title {
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }
  .item-source {
    font-size: 0.75rem;
    color: #8B8178;
    margin-bottom: 0.5rem;
  }
  .item-description {
    font-size: 0.875rem;
    color: #5D5147;
  }
  .cta-button {
    display: inline-block;
    padding: 0.75rem 1.5rem;
    background: #4A3728;
    color: white;
    text-decoration: none;
    border-radius: 0;
    font-weight: 500;
    margin-top: 0.5rem;
  }
  .cta-button:hover {
    background: #5A4738;
  }
`;

export function NewsletterPreview({
  htmlContent,
  title,
  className,
  disableLinks = false,
}: NewsletterPreviewProps) {
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'iframe-height') {
        setIframeHeight(event.data.height);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Build the complete HTML document for the iframe
  const iframeDocument = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>${iframeStyles}</style>
      </head>
      <body>
        ${htmlContent}
        <script>
          // Send height to parent for auto-sizing
          function sendHeight() {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ type: 'iframe-height', height }, '*');
          }
          // Initial height
          sendHeight();
          // Watch for changes
          new ResizeObserver(sendHeight).observe(document.body);
          // Also send on images load
          document.querySelectorAll('img').forEach(img => {
            img.addEventListener('load', sendHeight);
          });
          ${disableLinks ? `
          // Prevent all link clicks in preview (template preview mode)
          document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (link) {
              e.preventDefault();
              e.stopPropagation();
            }
          }, true);
          // Also make links look non-clickable
          document.querySelectorAll('a').forEach(a => {
            a.style.cursor = 'default';
          });
          ` : `
          // Make all links open in new tab (newsletter preview mode)
          document.querySelectorAll('a').forEach(a => {
            a.setAttribute('target', '_blank');
            a.setAttribute('rel', 'noopener noreferrer');
          });
          `}
        </script>
      </body>
    </html>
  `;

  return (
    <div className={cn(disableLinks ? "flex flex-col gap-4" : "space-y-4", className)}>
      {/* View mode toggle */}
      <div className="flex items-center justify-between shrink-0 mt-2 mx-4">
        {title ? (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/50 border border-border/50 backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest leading-none text-muted-foreground">Live Desktop</span>
          </div>
        ) : (
          <div />
        )}
        <div className="flex items-center gap-1 bg-secondary rounded-lg p-1">
          <button
            onClick={() => setViewMode("desktop")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              viewMode === "desktop"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Monitor className="h-3.5 w-3.5" />
            Desktop
          </button>
          <button
            onClick={() => setViewMode("mobile")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
              viewMode === "mobile"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Smartphone className="h-3.5 w-3.5" />
            Mobile
          </button>
        </div>
      </div>

      {/* Preview frame */}
      <div className={cn("flex justify-center", disableLinks && "")}>
        <Card
          className={cn(
            "overflow-hidden transition-all duration-300 ease-out",
            viewMode === "mobile"
              ? "w-full max-w-[375px] shadow-none border-8 border-foreground/10 rounded-3xl"
              : "w-full shadow-lg rounded-none",
            disableLinks && "flex flex-col"
          )}
        >
          {/* Email header bar for mobile */}
          {viewMode === "mobile" ? (
            <div className="bg-secondary/50 px-4 py-3 border-b">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-bold text-primary">M</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">
                    {title || "Newsletter Preview"}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    noreply@milkly.app
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          {/* Content area - using iframe for style isolation */}
          <div className={cn(
            "bg-white overflow-hidden",
            disableLinks ? "" : "min-h-[600px] h-[calc(100vh-200px)]"
          )}>
            <iframe
              ref={iframeRef}
              srcDoc={iframeDocument}
              title="Newsletter Preview"
              className="w-full border-0"
              style={disableLinks && iframeHeight ? { height: iframeHeight + 'px' } : { height: '100%' }}
              sandbox="allow-same-origin allow-scripts allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

// Empty state placeholder content with guidance
export function EmptyNewsletterPreview() {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed border-border/40 rounded-3xl bg-white/20 dark:bg-black/10 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-500">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mb-6 shadow-lg shadow-primary/5 ring-1 ring-primary/10">
        <Monitor className="h-10 w-10 text-primary/60" />
      </div>
      <h3 className="font-serif text-2xl font-medium text-foreground/90 mb-3 tracking-tight">
        Your Canvas awaits
      </h3>
      <p className="text-muted-foreground max-w-sm text-base leading-relaxed">
        Ready to see your masterpiece? Switch to the <span className="font-semibold text-foreground">Details & Content</span> tab to generate your first edition.
      </p>
    </div>
  );
}
