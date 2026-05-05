import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useWorkspace } from "@/store/workspace";
import { getEditorSelection } from "./CodeEditor";
import { Send, Loader2, Sparkles, FileCode, Wand2, Languages, Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;
const TOOL_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-tool`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type Tab = "chat" | "explain" | "scaffold" | "docs";

export function AgentPanel() {
  const [tab, setTab] = useState<Tab>("chat");

  return (
    <div className="flex h-full flex-col bg-panel">
      <div className="flex h-9 shrink-0 items-center gap-1 border-b border-border bg-sidebar px-2">
        <Sparkles size={14} className="text-primary" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          AI Agent
        </span>
      </div>
      <div className="flex shrink-0 border-b border-border bg-sidebar/60">
        {[
          { id: "chat", label: "Chat", icon: Sparkles },
          { id: "explain", label: "Explain", icon: Wand2 },
          { id: "scaffold", label: "Scaffold", icon: FileCode },
          { id: "docs", label: "Docs", icon: Languages },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as Tab)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 border-b-2 px-2 py-2 text-xs transition-colors",
              tab === t.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon size={12} />
            {t.label}
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-hidden">
        {tab === "chat" && <ChatTab />}
        {tab === "explain" && <ExplainTab />}
        {tab === "scaffold" && <ScaffoldTab />}
        {tab === "docs" && <DocsTab />}
      </div>
    </div>
  );
}

// --------------- Chat ---------------

function ChatTab() {
  const { chatMessages, addChatMessage, updateLastAssistant, clearChat, files, activeTab, language } =
    useWorkspace();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    addChatMessage(userMsg);
    setInput("");
    setLoading(true);

    const contextFile = activeTab
      ? { path: activeTab, content: files.find((f) => f.path === activeTab)?.content ?? "" }
      : null;

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          contextFile,
          language,
        }),
      });

      if (!resp.ok) {
        if (resp.status === 429) toast.error("Rate limit reached. Try again in a moment.");
        else if (resp.status === 402) toast.error("AI credits exhausted. Add credits in Lovable workspace.");
        else toast.error("AI request failed.");
        setLoading(false);
        return;
      }
      if (!resp.body) throw new Error("no body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let acc = "";
      let done = false;

      while (!done) {
        const { done: d, value } = await reader.read();
        if (d) break;
        buffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") {
            done = true;
            break;
          }
          try {
            const parsed = JSON.parse(json);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              acc += delta;
              updateLastAssistant(acc);
            }
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Connection error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border px-3 py-1.5">
        <span className="text-[11px] text-muted-foreground">
          {activeTab ? `Context: ${activeTab}` : "No file context"}
        </span>
        <button
          onClick={clearChat}
          className="text-[11px] text-muted-foreground hover:text-foreground"
        >
          Clear
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 scrollbar-thin">
        {chatMessages.length === 0 && (
          <div className="text-xs text-muted-foreground">
            Ask anything about your code. The active file is sent as context.
          </div>
        )}
        {chatMessages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "rounded-lg px-3 py-2 text-sm",
              m.role === "user"
                ? "ml-6 bg-primary/15 text-foreground"
                : "mr-6 bg-accent/40 text-foreground",
            )}
          >
            <div className="prose-chat">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content || "…"}</ReactMarkdown>
            </div>
          </div>
        ))}
      </div>
      <div className="shrink-0 border-t border-border p-2">
        <div className="flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask the agent…"
            rows={2}
            className="flex-1 resize-none rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

async function callTool(payload: any) {
  const resp = await fetch(TOOL_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${ANON}` },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    if (resp.status === 429) throw new Error("Rate limit reached. Try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted.");
    throw new Error("AI request failed.");
  }
  const json = await resp.json();
  return json.result;
}

// --------------- Explain ---------------

function ExplainTab() {
  const { activeTab, files, updateContent } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async (extra: string) => {
    const file = files.find((f) => f.path === activeTab);
    const sel = getEditorSelection();
    const code = sel || file?.content || "";
    if (!code.trim()) {
      toast.error("Open a file or select code first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await callTool({ mode: "explain", prompt: extra, code });
      setResult(r);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const apply = () => {
    if (!result?.improvedCode || !activeTab) return;
    const file = files.find((f) => f.path === activeTab);
    const sel = getEditorSelection();
    if (sel && file) {
      // Replace selection with improved code
      updateContent(activeTab, file.content.replace(sel, result.improvedCode));
    } else if (file) {
      updateContent(activeTab, result.improvedCode);
    }
    toast.success("Applied improved code");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-2">
        <div className="mb-2 text-[11px] text-muted-foreground">
          Uses your selection if any, otherwise the entire active file.
        </div>
        <div className="flex flex-wrap gap-1.5">
          {[
            ["Explain", "Explain this code in plain language."],
            ["Find bugs", "Find bugs and potential issues. Focus on correctness."],
            ["Improve", "Suggest improvements for readability and performance."],
          ].map(([label, p]) => (
            <button
              key={label}
              disabled={loading}
              onClick={() => run(p)}
              className="rounded-md border border-border bg-secondary px-2.5 py-1 text-xs hover:bg-accent disabled:opacity-50"
            >
              {label}
            </button>
          ))}
          {loading && <Loader2 size={14} className="ml-1 animate-spin text-primary" />}
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-3 text-sm scrollbar-thin">
        {!result && !loading && (
          <div className="text-xs text-muted-foreground">Pick an action above to analyze your code.</div>
        )}
        {result && (
          <>
            <Section title="Summary">
              <p>{result.summary}</p>
            </Section>
            <Section title="Walkthrough">
              <ul className="list-disc space-y-1 pl-5">
                {result.walkthrough?.map((w: string, i: number) => <li key={i}>{w}</li>)}
              </ul>
            </Section>
            <Section title={`Issues (${result.issues?.length ?? 0})`}>
              {result.issues?.length ? (
                <ul className="space-y-2">
                  {result.issues.map((iss: any, i: number) => (
                    <li key={i} className="rounded border border-border bg-background/40 p-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                            iss.severity === "error" && "bg-destructive/30 text-destructive-foreground",
                            iss.severity === "warning" && "bg-amber-500/30 text-amber-200",
                            iss.severity === "info" && "bg-primary/25 text-primary-foreground",
                          )}
                        >
                          {iss.severity}
                        </span>
                        <span className="font-medium">{iss.title}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">{iss.detail}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-muted-foreground">No issues detected.</p>
              )}
            </Section>
            {result.improvedCode && (
              <Section
                title="Improved code"
                action={
                  <button
                    onClick={apply}
                    className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-medium text-primary-foreground hover:opacity-90"
                  >
                    Apply to file
                  </button>
                }
              >
                <CodeBlock code={result.improvedCode} />
              </Section>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --------------- Scaffold ---------------

function ScaffoldTab() {
  const { replaceProject } = useWorkspace();
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await callTool({ mode: "scaffold", prompt });
      setResult(r);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const create = () => {
    if (!result?.files?.length) return;
    if (!window.confirm(`Replace your workspace with ${result.files.length} new files?`)) return;
    replaceProject(result.files);
    toast.success(`Created project: ${result.name}`);
    setResult(null);
    setPrompt("");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-3 space-y-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder='e.g. "Create a React + TypeScript todo app with localStorage persistence"'
          rows={3}
          className="w-full resize-none rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={run}
          disabled={loading || !prompt.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-primary py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Generate project
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
        {!result && !loading && (
          <div className="text-xs text-muted-foreground">
            Describe a project. The agent will return a complete file tree which you can preview before applying.
          </div>
        )}
        {loading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 size={14} className="animate-spin" /> Generating files…
          </div>
        )}
        {result && (
          <div className="space-y-3 text-sm">
            <div>
              <div className="font-semibold">{result.name}</div>
              <div className="text-xs text-muted-foreground">{result.description}</div>
            </div>
            <div className="rounded-md border border-border bg-background/40 p-2 text-xs font-mono">
              {result.files?.map((f: any) => (
                <div key={f.path} className="py-0.5">
                  📄 {f.path}{" "}
                  <span className="text-muted-foreground">({f.content?.length ?? 0} chars)</span>
                </div>
              ))}
            </div>
            <button
              onClick={create}
              className="w-full rounded-md bg-primary py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90"
            >
              Create project ({result.files?.length} files)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// --------------- Docs ---------------

function DocsTab() {
  const { activeTab, files, updateContent } = useWorkspace();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const run = async () => {
    const file = files.find((f) => f.path === activeTab);
    const sel = getEditorSelection();
    const code = sel || file?.content || "";
    if (!code.trim()) {
      toast.error("Open a file or select code first.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const r = await callTool({ mode: "docs", code });
      setResult(r);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const insertAsComments = () => {
    if (!result || !activeTab) return;
    const file = files.find((f) => f.path === activeTab);
    if (!file) return;
    const en = result.english;
    const ur = result.urdu;
    const block = `/**\n * @overview ${en.overview}\n * @returns ${en.returns}\n${en.parameters?.map((p: string) => ` * @param ${p}`).join("\n") ?? ""}\n *\n * Urdu / اردو:\n * ${ur.overview}\n */\n`;
    updateContent(activeTab, block + file.content);
    toast.success("Inserted documentation");
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border p-2">
        <div className="flex items-center gap-2">
          <button
            onClick={run}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1 text-xs font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Languages size={12} />}
            Generate bilingual docs
          </button>
          {result && (
            <button
              onClick={insertAsComments}
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
            >
              Insert as comments
            </button>
          )}
        </div>
        <div className="mt-1.5 text-[11px] text-muted-foreground">
          Generates parallel English + Urdu (Nastaliq) documentation.
        </div>
      </div>
      <div className="flex-1 space-y-4 overflow-y-auto p-3 scrollbar-thin">
        {!result && !loading && (
          <div className="text-xs text-muted-foreground">
            Open a file (or select code) and click Generate.
          </div>
        )}
        {result && (
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">English</div>
              <DocBlock doc={result.english} />
            </div>
            <div className="space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">اردو</div>
              <DocBlock doc={result.urdu} urdu />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DocBlock({ doc, urdu }: { doc: any; urdu?: boolean }) {
  return (
    <div className={cn("space-y-2 rounded-md border border-border bg-background/40 p-3 text-sm", urdu && "urdu")}>
      <p>{doc.overview}</p>
      {doc.parameters?.length > 0 && (
        <div>
          <div className="text-xs font-semibold opacity-70">{urdu ? "پیرامیٹرز" : "Parameters"}</div>
          <ul className={cn("list-disc pl-5", urdu && "pr-5 pl-0")}>
            {doc.parameters.map((p: string, i: number) => <li key={i}>{p}</li>)}
          </ul>
        </div>
      )}
      <div>
        <div className="text-xs font-semibold opacity-70">{urdu ? "واپسی" : "Returns"}</div>
        <p>{doc.returns}</p>
      </div>
      {doc.example && (
        <div dir="ltr">
          <div className="text-xs font-semibold opacity-70">{urdu ? "مثال" : "Example"}</div>
          <CodeBlock code={doc.example} />
        </div>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-primary">{title}</h3>
        {action}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="relative">
      <pre className="max-h-72 overflow-auto rounded-md border border-border bg-panel p-2 text-xs scrollbar-thin">
        <code>{code}</code>
      </pre>
      <button
        onClick={() => {
          navigator.clipboard.writeText(code);
          setCopied(true);
          setTimeout(() => setCopied(false), 1200);
        }}
        className="absolute right-1.5 top-1.5 rounded bg-background/80 p-1 text-muted-foreground hover:text-foreground"
        title="Copy"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}
