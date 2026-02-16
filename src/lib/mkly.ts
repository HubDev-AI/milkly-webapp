import { mkly, createCompletionData, CORE_KIT, CORE_SCHEMAS, injectSampleContent } from "@mkly";
import { NEWSLETTER_KIT, NEWSLETTER_SCHEMAS } from "@mkly-kits/newsletter/src";
import type { CompileResult, CompletionData } from "@mkly";

const KITS = { core: CORE_KIT, newsletter: NEWSLETTER_KIT };

let _completionData: CompletionData | null = null;

export function compileMkly(source: string): CompileResult {
  return mkly(source, { kits: KITS });
}

/** Compile a structure-only template with injected sample content for preview. */
export function compileTemplatePreview(structureSource: string): CompileResult {
  const withSamples = injectSampleContent(structureSource, KITS);
  return mkly(withSamples, { kits: KITS });
}

/** Strip <script> tags from compiled HTML for use in sandboxed srcDoc iframes. */
export function stripScripts(html: string): string {
  return html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
}

export function getMklyCompletionData(): CompletionData {
  if (!_completionData) {
    _completionData = createCompletionData(
      [...CORE_SCHEMAS, ...NEWSLETTER_SCHEMAS],
      [CORE_KIT, NEWSLETTER_KIT],
    );
  }
  return _completionData;
}
