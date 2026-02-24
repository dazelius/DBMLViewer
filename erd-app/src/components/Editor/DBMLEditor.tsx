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
      const markers: Monaco.editor.IMarkerData[] = errors.map((err) => {
        const line = Math.max(1, err.line);
        const col = Math.max(1, err.column);
        const safeLine = Math.min(line, model.getLineCount());
        const lineContent = model.getLineContent(safeLine);
        const endCol = Math.max(col + 1, lineContent.length + 1);
        const isWarning = err.message.startsWith('[!]');

        return {
          severity: isWarning ? monaco.MarkerSeverity.Warning : monaco.MarkerSeverity.Error,
          message: err.message,
          startLineNumber: line,
          startColumn: 1,
          endLineNumber: line,
          endColumn: endCol,
        };
      });
      monaco.editor.setModelMarkers(model, 'dbml', markers);
    }
  }, [errors]);

  const jumpToError = useCallback((line: number, column: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    const safeLine = Math.max(1, line);
    editor.revealLineInCenter(safeLine);
    editor.setPosition({ lineNumber: safeLine, column: Math.max(1, column) });
    editor.focus();
  }, []);

  const firstError = errors.length > 0 ? errors[0] : null;
  const currentTheme = document.documentElement.getAttribute('data-theme');

  return (
    <div className="h-full w-full flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Header */}
      <div
        className="flex items-center px-3 h-8 text-[11px] font-semibold flex-shrink-0"
        style={{ background: 'var(--bg-surface)', color: 'var(--text-muted)', borderBottom: '1px solid var(--border-color)' }}
      >
        DBML Editor
        {errors.length > 0 && (
          <button
            onClick={() => firstError && jumpToError(firstError.line, firstError.column)}
            className="ml-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold cursor-pointer interactive"
            style={{ background: 'var(--error)', color: '#fff' }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
            title={firstError ? `Line ${firstError.line}: ${firstError.message}` : ''}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {errors.length} error{errors.length > 1 ? 's' : ''} — Go to line {firstError?.line}
          </button>
        )}
      </div>

      {/* Error detail bar */}
      {firstError && (
        <div
          className="flex items-center gap-2 px-3 py-1.5 text-[11px] flex-shrink-0 cursor-pointer interactive"
          style={{
            background: 'var(--error-muted)',
            color: 'var(--error)',
            borderBottom: '1px solid var(--border-color)',
          }}
          onClick={() => jumpToError(firstError.line, firstError.column)}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="flex-shrink-0">
            <polyline points="9 18 15 12 9 6" />
          </svg>
          <span className="font-mono font-semibold flex-shrink-0">Ln {firstError.line}, Col {firstError.column}</span>
          <span className="truncate">{firstError.message}</span>
          {errors.length > 1 && (
            <span className="ml-auto flex-shrink-0 opacity-60">+{errors.length - 1} more</span>
          )}
        </div>
      )}

      {/* Monaco Editor */}
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
