import { create } from "zustand";
import { persist } from "zustand/middleware";

export type FileNode = {
  path: string; // unique full path, e.g. "src/App.tsx"
  content: string;
};

export type ChatMessage = { role: "user" | "assistant"; content: string };

type Workspace = {
  files: FileNode[];
  openTabs: string[]; // paths
  activeTab: string | null;
  language: "en" | "ur";
  chatMessages: ChatMessage[];
  rightPanelOpen: boolean;
  bottomPanelOpen: boolean;
  bottomPanelContent: string | null;
  // actions
  setActive: (path: string | null) => void;
  openFile: (path: string) => void;
  closeTab: (path: string) => void;
  createFile: (path: string, content?: string) => void;
  deleteFile: (path: string) => void;
  renameFile: (oldPath: string, newPath: string) => void;
  updateContent: (path: string, content: string) => void;
  replaceProject: (files: FileNode[]) => void;
  setLanguage: (l: "en" | "ur") => void;
  addChatMessage: (m: ChatMessage) => void;
  updateLastAssistant: (content: string) => void;
  clearChat: () => void;
  toggleRightPanel: () => void;
  toggleBottomPanel: (content?: string) => void;
  setBottomContent: (content: string | null) => void;
};

const SAMPLE: FileNode[] = [
  {
    path: "README.md",
    content:
      "# Welcome to PakDev Studio\n\nA browser-based, AI-powered code editor.\n\n- Try the **AI Agent** panel on the right.\n- Use **Explain** on selected code.\n- Generate **bilingual docs** (English + Urdu).\n",
  },
  {
    path: "src/App.tsx",
    content: `import React from "react";

export default function App() {
  const [count, setCount] = React.useState(0);

  // Try selecting this function and click "Explain" in the Agent panel
  function handleClick() {
    setCount(count + 1);
  }

  return (
    <div style={{ padding: 24, fontFamily: "sans-serif" }}>
      <h1>Hello from PakDev Studio 👋</h1>
      <p>You clicked {count} times</p>
      <button onClick={handleClick}>Click me</button>
    </div>
  );
}
`,
  },
  {
    path: "src/utils.ts",
    content: `// Sum of an array of numbers
export function sum(nums: number[]): number {
  let total = 0;
  for (let i = 0; i <= nums.length; i++) {
    total += nums[i];
  }
  return total;
}
`,
  },
];

export const useWorkspace = create<Workspace>()(
  persist(
    (set, get) => ({
      files: SAMPLE,
      openTabs: ["src/App.tsx"],
      activeTab: "src/App.tsx",
      language: "en",
      chatMessages: [],
      rightPanelOpen: true,
      bottomPanelOpen: false,
      bottomPanelContent: null,

      setActive: (path) => set({ activeTab: path }),

      openFile: (path) => {
        const { openTabs } = get();
        set({
          activeTab: path,
          openTabs: openTabs.includes(path) ? openTabs : [...openTabs, path],
        });
      },

      closeTab: (path) => {
        const { openTabs, activeTab } = get();
        const next = openTabs.filter((p) => p !== path);
        set({
          openTabs: next,
          activeTab: activeTab === path ? next[next.length - 1] ?? null : activeTab,
        });
      },

      createFile: (path, content = "") => {
        const { files, openTabs } = get();
        if (files.some((f) => f.path === path)) return;
        set({
          files: [...files, { path, content }],
          openTabs: [...openTabs, path],
          activeTab: path,
        });
      },

      deleteFile: (path) => {
        const { files, openTabs, activeTab } = get();
        const nextOpen = openTabs.filter((p) => p !== path);
        set({
          files: files.filter((f) => f.path !== path),
          openTabs: nextOpen,
          activeTab: activeTab === path ? nextOpen[nextOpen.length - 1] ?? null : activeTab,
        });
      },

      renameFile: (oldPath, newPath) => {
        const { files, openTabs, activeTab } = get();
        if (files.some((f) => f.path === newPath)) return;
        set({
          files: files.map((f) => (f.path === oldPath ? { ...f, path: newPath } : f)),
          openTabs: openTabs.map((p) => (p === oldPath ? newPath : p)),
          activeTab: activeTab === oldPath ? newPath : activeTab,
        });
      },

      updateContent: (path, content) => {
        set({
          files: get().files.map((f) => (f.path === path ? { ...f, content } : f)),
        });
      },

      replaceProject: (files) => {
        const first = files[0]?.path ?? null;
        set({
          files,
          openTabs: first ? [first] : [],
          activeTab: first,
        });
      },

      setLanguage: (language) => set({ language }),

      addChatMessage: (m) => set({ chatMessages: [...get().chatMessages, m] }),

      updateLastAssistant: (content) => {
        const msgs = get().chatMessages;
        const last = msgs[msgs.length - 1];
        if (last?.role === "assistant") {
          set({
            chatMessages: msgs.map((m, i) => (i === msgs.length - 1 ? { ...m, content } : m)),
          });
        } else {
          set({ chatMessages: [...msgs, { role: "assistant", content }] });
        }
      },

      clearChat: () => set({ chatMessages: [] }),

      toggleRightPanel: () => set({ rightPanelOpen: !get().rightPanelOpen }),
      toggleBottomPanel: (content) =>
        set({
          bottomPanelOpen: !get().bottomPanelOpen,
          bottomPanelContent: content ?? get().bottomPanelContent,
        }),
      setBottomContent: (bottomPanelContent) =>
        set({ bottomPanelContent, bottomPanelOpen: bottomPanelContent != null }),
    }),
    {
      name: "pakdev-workspace-v1",
      partialize: (s) => ({
        files: s.files,
        openTabs: s.openTabs,
        activeTab: s.activeTab,
        language: s.language,
      }),
    },
  ),
);

export function languageFromPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "ts": return "typescript";
    case "tsx": return "typescript";
    case "js": return "javascript";
    case "jsx": return "javascript";
    case "json": return "json";
    case "html": return "html";
    case "css": return "css";
    case "md": return "markdown";
    case "py": return "python";
    case "sh": return "shell";
    case "yml":
    case "yaml": return "yaml";
    default: return "plaintext";
  }
}
