import { useEffect, useMemo } from 'react';
import { EditorShell } from '@mklyml/editor/layout/EditorShell';
import { useEditorStore } from '@mklyml/editor/store/editor-store';
import { useCompile } from '@mklyml/editor/store/use-compile';
import { getMklyCompletionData } from '@/lib/mkly';
import { useTheme } from '@/hooks/use-theme';

interface EmbeddedMklyEditorProps {
  documentId?: string;
}

export function EmbeddedMklyEditor({ documentId }: EmbeddedMklyEditorProps) {
  // Sync editor theme with webapp theme — set store AND localStorage so the
  // editor's own useTheme() init doesn't override with a stale value.
  const { theme } = useTheme();
  useEffect(() => {
    useEditorStore.getState().setTheme(theme);
    localStorage.setItem('mkly-editor-theme', theme);
  }, [theme]);

  // Initialize compilation loop (compiles source -> HTML on changes)
  useCompile();

  // Use the webapp's cached completion data (includes schemas for richer autocomplete)
  const completionData = useMemo(() => getMklyCompletionData(), []);

  return (
    <div className="mkly-editor-root" style={{ height: '100%' }}>
      <EditorShell completionData={completionData} documentId={documentId} />
    </div>
  );
}
