import { useMemo, useState } from "react";
import { useWorkspace, type FileNode } from "@/store/workspace";
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  FilePlus,
  FolderPlus,
  Trash2,
  Pencil,
  Folder,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TreeNode =
  | { type: "file"; name: string; path: string }
  | { type: "dir"; name: string; path: string; children: TreeNode[] };

function buildTree(files: FileNode[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const f of [...files].sort((a, b) => a.path.localeCompare(b.path))) {
    const parts = f.path.split("/");
    let level = root;
    let curPath = "";
    parts.forEach((part, i) => {
      curPath = curPath ? `${curPath}/${part}` : part;
      if (i === parts.length - 1) {
        level.push({ type: "file", name: part, path: f.path });
      } else {
        let dir = level.find(
          (n) => n.type === "dir" && n.name === part,
        ) as Extract<TreeNode, { type: "dir" }> | undefined;
        if (!dir) {
          dir = { type: "dir", name: part, path: curPath, children: [] };
          level.push(dir);
        }
        level = dir.children;
      }
    });
  }
  // sort dirs first
  const sortRec = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    for (const n of nodes) if (n.type === "dir") sortRec(n.children);
  };
  sortRec(root);
  return root;
}

export function FileExplorer() {
  const { files, activeTab, openFile, createFile, deleteFile, renameFile } = useWorkspace();
  const tree = useMemo(() => buildTree(files), [files]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ src: true });
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  function handleNew(kind: "file" | "folder") {
    const name = window.prompt(
      kind === "file" ? "New file path (e.g. src/Button.tsx):" : "New folder path (e.g. src/components):",
    );
    if (!name) return;
    if (kind === "file") {
      createFile(name);
    } else {
      // folders only exist if they contain files; create a placeholder
      createFile(`${name.replace(/\/$/, "")}/.gitkeep`, "");
    }
  }

  const renderNode = (node: TreeNode, depth = 0) => {
    if (node.type === "dir") {
      const isOpen = expanded[node.path] ?? false;
      return (
        <div key={node.path}>
          <button
            onClick={() => setExpanded({ ...expanded, [node.path]: !isOpen })}
            className="flex w-full items-center gap-1 rounded px-1 py-0.5 text-xs text-sidebar-foreground hover:bg-sidebar-accent"
            style={{ paddingLeft: 4 + depth * 12 }}
          >
            {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <Folder size={12} className="text-primary" />
            <span className="truncate">{node.name}</span>
          </button>
          {isOpen && <div>{node.children.map((c) => renderNode(c, depth + 1))}</div>}
        </div>
      );
    }
    const isActive = activeTab === node.path;
    const isRenaming = renaming === node.path;
    return (
      <div
        key={node.path}
        className={cn(
          "group flex items-center gap-1 rounded px-1 py-0.5 text-xs",
          isActive
            ? "bg-sidebar-accent text-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60",
        )}
        style={{ paddingLeft: 16 + depth * 12 }}
      >
        <FileIcon size={12} className="text-muted-foreground" />
        {isRenaming ? (
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={() => {
              if (renameValue && renameValue !== node.path) renameFile(node.path, renameValue);
              setRenaming(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") setRenaming(null);
            }}
            className="h-5 flex-1 rounded border border-border bg-background px-1 text-xs outline-none focus:border-primary"
          />
        ) : (
          <button onClick={() => openFile(node.path)} className="flex-1 truncate text-left">
            {node.name}
          </button>
        )}
        <div className="hidden gap-0.5 group-hover:flex">
          <button
            title="Rename"
            onClick={() => {
              setRenaming(node.path);
              setRenameValue(node.path);
            }}
            className="rounded p-0.5 hover:bg-accent"
          >
            <Pencil size={10} />
          </button>
          <button
            title="Delete"
            onClick={() => {
              if (window.confirm(`Delete ${node.path}?`)) deleteFile(node.path);
            }}
            className="rounded p-0.5 hover:bg-destructive/30"
          >
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-9 items-center justify-between border-b border-sidebar-border px-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <span>Explorer</span>
        <div className="flex gap-1">
          <button
            title="New file"
            onClick={() => handleNew("file")}
            className="rounded p-1 hover:bg-sidebar-accent"
          >
            <FilePlus size={13} />
          </button>
          <button
            title="New folder"
            onClick={() => handleNew("folder")}
            className="rounded p-1 hover:bg-sidebar-accent"
          >
            <FolderPlus size={13} />
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1 scrollbar-thin">
        {tree.length === 0 ? (
          <div className="p-3 text-xs text-muted-foreground">No files yet. Click + to create one.</div>
        ) : (
          tree.map((n) => renderNode(n))
        )}
      </div>
    </div>
  );
}
