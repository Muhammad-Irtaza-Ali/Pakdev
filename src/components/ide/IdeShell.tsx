import { useState } from "react";
import JSZip from "jszip";
import { Files, MessageSquare, Download, PanelRightClose, PanelRightOpen, Code2 } from "lucide-react";
import { useWorkspace } from "@/store/workspace";
import { FileExplorer } from "./FileExplorer";
import { CodeEditor } from "./CodeEditor";
import { AgentPanel } from "./AgentPanel";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";

type SideView = "files" | "agent-mobile" | null;

export function IdeShell() {
  const { rightPanelOpen, toggleRightPanel, language, setLanguage, files } = useWorkspace();
  const [sideView, setSideView] = useState<SideView>("files");

  const downloadZip = async () => {
    const zip = new JSZip();
    files.forEach((f) => zip.file(f.path, f.content));
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "pakdev-project.zip";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Project downloaded");
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background text-foreground">
      {/* Top bar */}
      <header className="flex h-10 shrink-0 items-center justify-between border-b border-border bg-sidebar px-3">
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/20">
              <Code2 size={14} className="text-primary" />
            </div>
            <span className="text-sm font-semibold tracking-tight">
              PakDev <span className="text-primary">Studio</span>
            </span>
          </Link>
          <span className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground sm:inline-block">
            beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as "en" | "ur")}
            className="rounded-md border border-border bg-background px-2 py-1 text-xs focus:border-primary focus:outline-none"
            title="AI response language"
          >
            <option value="en">EN</option>
            <option value="ur">اردو</option>
          </select>
          <button
            onClick={downloadZip}
            className="flex items-center gap-1.5 rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-accent"
          >
            <Download size={12} /> Download
          </button>
          <button
            onClick={toggleRightPanel}
            title="Toggle AI panel"
            className="rounded-md border border-border bg-secondary p-1.5 text-xs hover:bg-accent"
          >
            {rightPanelOpen ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
          </button>
        </div>
      </header>

      {/* Main */}
      <div className="flex min-h-0 flex-1">
        {/* Activity bar */}
        <nav className="flex w-12 shrink-0 flex-col items-center gap-2 border-r border-border bg-activity py-2">
          <ActivityButton
            icon={Files}
            label="Files"
            active={sideView === "files"}
            onClick={() => setSideView(sideView === "files" ? null : "files")}
          />
          <ActivityButton
            icon={MessageSquare}
            label="AI Agent"
            active={rightPanelOpen}
            onClick={toggleRightPanel}
          />
        </nav>

        {/* Sidebar */}
        {sideView === "files" && (
          <aside className="w-60 shrink-0 border-r border-border">
            <FileExplorer />
          </aside>
        )}

        {/* Editor */}
        <main className="min-w-0 flex-1">
          <CodeEditor />
        </main>

        {/* Right AI panel */}
        {rightPanelOpen && (
          <aside className="hidden w-96 shrink-0 border-l border-border md:block">
            <AgentPanel />
          </aside>
        )}
      </div>

      {/* Mobile fallback notice */}
      <div className="md:hidden border-t border-border bg-panel p-2 text-center text-[11px] text-muted-foreground">
        💡 PakDev Studio works best on desktop. The AI panel is hidden on small screens.
      </div>
    </div>
  );
}

function ActivityButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: any;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      className={cn(
        "relative flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground",
        active && "text-foreground",
      )}
    >
      {active && <span className="absolute left-0 h-5 w-0.5 rounded-r bg-primary" />}
      <Icon size={18} />
    </button>
  );
}
