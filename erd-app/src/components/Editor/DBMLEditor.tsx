import { useRef, useCallback, useEffect } from 'react';
import Editor, { type OnMount, type BeforeMount } from '@monaco-editor/react';
import type * as Monaco from 'monaco-editor';
import { registerDBMLLanguage } from './dbmlLanguage.ts';
import { useEditorStore } from '../../store/useEditorStore.ts';
import { useSchemaStore } from '../../store/useSchemaStore.ts';
export default function DBMLEditor() {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const dbmlText = useEditorStore((s) => s.dbmlText);
  const setDbmlText = useEditorStore((s) => s.setDbmlText);
  const errors = useSchemaStore((s) => s.errors);

  const handleBeforeMount: BeforeMount = useCallback((monaco) => {
    registerDBMLLanguage(monaco);
  }, []);

  const handleMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.focus();
  }, []);

  useEffect(() => {
    const monaco = monacoRef.current;
    const editor = editorRef.current;
    if (!monaco || !editor) return;

    const model = editor.getModel();
    if (!model) return;

    if (errors.length === 0) {
      monaco.editor.setModelMarkers(model, 'dbml', []);
    } else {
      const markers: Monaco.editor.IMarkerData[] = errors.map((err) => ({
        severity: monaco.MarkerSeverity.Error,
        message: err.message,
        startLineNumber: err.line,
        startColumn: err.column,
        endLineNumber: err.line,
        endColumn: err.column + 20,
      }));
      monaco.editor.setModelMarkers(model, 'dbml', markers);
    }
  }, [errors]);

  const currentTheme = document.documentElement.getAttribute('data-theme');

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="flex items-center px-3 h-8 text-xs font-medium flex-shrink-0"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        DBML Editor
        {errors.length > 0 && (
          <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'var(--error)', color: '#fff' }}>
            {errors.length} error{errors.length > 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div className="flex-1">
        <Editor
          defaultLanguage="dbml"
          value={dbmlText}
          onChange={(value) => setDbmlText(value ?? '')}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          theme={currentTheme === 'light' ? 'dbml-light' : 'dbml-dark'}
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            lineHeight: 20,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            padding: { top: 8 },
            renderLineHighlight: 'line',
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            bracketPairColorization: { enabled: true },
          }}
        />
      </div>
    </div>
  );
}
