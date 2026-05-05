import { useEffect, useMemo, useRef, useState } from "react";
import Editor, { type OnMount, loader } from "@monaco-editor/react";
import { useWorkspace, languageFromPath } from "@/store/workspace";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

// Cache the selection so the AI panel can read it
let _lastSelection = "";
export function getEditorSelection(): string {
  return _lastSelection;
}

// Configure Monaco theme once
let themeConfigured = false;
function configureTheme() {
  if (themeConfigured) return;
  themeConfigured = true;
  loader.init().then((monaco) => {
    monaco.editor.defineTheme("pakdev-dark", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        "editor.background": "#1c2230",
        "editor.foreground": "#e6eaf2",
        "editorLineNumber.foreground": "#4a5468",
        "editorLineNumber.activeForeground": "#9aa4b8",
        "editor.selectionBackground": "#3b82f655",
        "editor.lineHighlightBackground": "#232a3a",
        "editorCursor.foreground": "#7cc7ff",
        "editorIndentGuide.background": "#2a3142",
      },
    });
  });
}

export function CodeEditor() {
  const { files, openTabs, activeTab, setActive, closeTab, updateContent } = useWorkspace();
  const editorRef = useRef<any>(null);
  const [, force] = useState(0);

  useEffect(() => {
    configureTheme();
  }, []);

  const activeFile = useMemo(
    () => files.find((f) => f.path === activeTab) ?? null,
    [files, activeTab],
  );

  const onMount: OnMount = (editor) => {
    editorRef.current = editor;
    editor.onDidChangeCursorSelection(() => {
      const model = editor.getModel();
      const sel = editor.getSelection();
      if (model && sel) {
        _lastSelection = model.getValueInRange(sel);
        force((n) => n + 1);
      }
    });
  };

  return (
    <div className="flex h-full flex-col bg-editor">
      {/* Tabs */}
      <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-border bg-panel scrollbar-thin">
        {openTabs.length === 0 ? (
          <div className="px-3 text-xs text-muted-foreground">No file open</div>
        ) : (
          openTabs.map((p) => (
            <button
              key={p}
              onClick={() => setActive(p)}
              className={cn(
                "group flex h-9 items-center gap-2 border-r border-border px-3 text-xs",
                activeTab === p
                  ? "bg-editor text-foreground"
                  : "bg-panel text-muted-foreground hover:bg-editor/60",
              )}
            >
              <span className="font-mono">{p.split("/").pop()}</span>
              <span
                role="button"
                aria-label={`Close ${p}`}
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(p);
                }}
                className="rounded p-0.5 opacity-60 hover:bg-accent hover:opacity-100"
              >
                <X size={12} />
              </span>
            </button>
          ))
        )}
      </div>

      {/* Editor area */}
      <div className="min-h-0 flex-1">
        {activeFile ? (
          <Editor
            key={activeFile.path}
            theme="pakdev-dark"
            language={languageFromPath(activeFile.path)}
            value={activeFile.content}
            onChange={(v) => updateContent(activeFile.path, v ?? "")}
            onMount={onMount}
            options={{
              fontFamily: "JetBrains Mono, ui-monospace, monospace",
              fontSize: 13,
              minimap: { enabled: false },
              smoothScrolling: true,
              cursorSmoothCaretAnimation: "on",
              scrollBeyondLastLine: false,
              renderLineHighlight: "all",
              tabSize: 2,
              automaticLayout: true,
              padding: { top: 12, bottom: 12 },
            }}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Open a file from the sidebar to start editing.
          </div>
        )}
      </div>
    </div>
  );
}
