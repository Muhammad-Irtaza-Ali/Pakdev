import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Sparkles,
  Wand2,
  FileCode,
  Languages,
  Code2,
  ArrowRight,
  Zap,
  Shield,
  GraduationCap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PakDev Studio — AI-Powered Code Editor for Pakistan" },
      {
        name: "description",
        content:
          "Browser-based AI code editor: scaffold projects from natural language, get real-time code review, generate bilingual English + Urdu documentation. Built for Pakistan's developers.",
      },
      { property: "og:title", content: "PakDev Studio — AI-Powered Code Editor" },
      {
        property: "og:description",
        content:
          "AI-first browser IDE built for Pakistan. Scaffold, fix, document — all powered by AI.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20">
              <Code2 size={16} className="text-primary" />
            </div>
            <span className="text-base font-semibold tracking-tight">
              PakDev <span className="text-primary">Studio</span>
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground sm:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#mission" className="hover:text-foreground">Mission</a>
          </nav>
          <Link
            to="/studio"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Launch Studio <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,oklch(0.68_0.16_240/0.15),transparent_50%),radial-gradient(circle_at_75%_80%,oklch(0.72_0.15_155/0.12),transparent_50%)]"
        />
        <div className="relative mx-auto max-w-6xl px-4 py-20 text-center sm:py-28">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-secondary/50 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles size={12} className="text-primary" /> AI-first IDE for Pakistani developers
          </div>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Code smarter with{" "}
            <span className="bg-gradient-to-r from-primary to-accent-green bg-clip-text text-transparent">
              PakDev Studio
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A browser-based AI coding ecosystem with project scaffolding, real-time code review, and
            bilingual English + Urdu documentation — built to bridge the gap between academic learning and
            professional software development.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link
              to="/studio"
              className="flex items-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Launch Studio <ArrowRight size={16} />
            </Link>
            <a
              href="#features"
              className="rounded-md border border-border bg-secondary px-5 py-2.5 text-sm font-medium hover:bg-accent"
            >
              See features
            </a>
          </div>

          {/* Mock IDE preview */}
          <div className="relative mx-auto mt-14 max-w-4xl rounded-xl border border-border bg-panel p-2 shadow-2xl shadow-primary/10">
            <div className="flex h-7 items-center gap-1.5 px-2">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent-green/60" />
              <span className="ml-3 text-[11px] text-muted-foreground">PakDev Studio — sample.tsx</span>
            </div>
            <div className="grid grid-cols-12 gap-0 overflow-hidden rounded-md border border-border bg-editor text-left text-xs">
              <div className="col-span-3 border-r border-border bg-sidebar p-3 font-mono text-muted-foreground">
                <div className="mb-2 text-[10px] uppercase">Explorer</div>
                <div>📁 src</div>
                <div className="pl-3">📄 App.tsx</div>
                <div className="pl-3 text-foreground">📄 utils.ts</div>
                <div>📄 README.md</div>
              </div>
              <div className="col-span-6 p-3 font-mono">
                <div className="text-muted-foreground">// Try the AI agent on this code</div>
                <div>
                  <span className="text-primary">export function</span>{" "}
                  <span className="text-accent-green">sum</span>(nums: number[]) {"{"}
                </div>
                <div className="pl-4">
                  <span className="text-primary">let</span> total = 0;
                </div>
                <div className="pl-4">
                  <span className="text-primary">for</span> (let i = 0; i {"<="} nums.length; i++) {"{"}
                </div>
                <div className="pl-8">total += nums[i];</div>
                <div className="pl-4">{"}"}</div>
                <div className="pl-4">
                  <span className="text-primary">return</span> total;
                </div>
                <div>{"}"}</div>
              </div>
              <div className="col-span-3 border-l border-border bg-panel p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase text-primary">
                  <Sparkles size={10} /> Agent
                </div>
                <p className="text-[11px] leading-relaxed text-muted-foreground">
                  Off-by-one bug detected: loop runs past <code className="text-foreground">nums.length</code>.
                  Use <code className="text-foreground">{"i < nums.length"}</code>.
                </p>
                <div className="mt-2 rounded bg-primary/20 px-1.5 py-0.5 text-[10px] text-primary">
                  Apply fix →
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border bg-panel/40 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to code with AI
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-muted-foreground">
            A modern IDE with AI features that adapt to how you actually work.
          </p>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Sparkles,
                title: "AI Chat Agent",
                desc: "Conversational assistant that understands your active file. Ask anything, get real answers with code.",
              },
              {
                icon: Wand2,
                title: "Explain & Improve",
                desc: "Select code, get a plain-language walkthrough, bug list, and one-click refactor suggestions.",
              },
              {
                icon: FileCode,
                title: "Project Scaffolding",
                desc: "“Build me a React e-commerce storefront.” Get a complete file tree, ready to edit and download.",
              },
              {
                icon: Languages,
                title: "Bilingual Docs",
                desc: "Generate parallel English + Urdu documentation, rendered in proper Nastaliq script.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50"
              >
                <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-md bg-primary/15 text-primary">
                  <f.icon size={18} />
                </div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section id="mission" className="border-t border-border py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2 lg:items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Built for{" "}
              <span className="bg-gradient-to-r from-primary to-accent-green bg-clip-text text-transparent">
                Pakistan's tech community
              </span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              PakDev Studio is purpose-built to support local software houses, students, and freelancers —
              empowering local talent and bridging the academic-to-professional skill gap.
            </p>
            <div className="mt-6 space-y-3">
              {[
                {
                  icon: GraduationCap,
                  title: "Academic-to-professional bridge",
                  desc: "AI features connect classroom concepts with real-world development.",
                },
                {
                  icon: Languages,
                  title: "Bilingual by design",
                  desc: "Urdu documentation makes knowledge accessible to your whole team.",
                },
                {
                  icon: Zap,
                  title: "Cleaner, faster, simpler",
                  desc: "All the power of leading IDEs, with a UI that doesn't get in the way.",
                },
                {
                  icon: Shield,
                  title: "No installs",
                  desc: "Runs entirely in your browser. Open a tab, start coding.",
                },
              ].map((p) => (
                <div key={p.title} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-green/15 text-accent-green">
                    <p.icon size={14} />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-8">
            <div className="text-sm uppercase tracking-wider text-muted-foreground">Try it now</div>
            <h3 className="mt-2 text-2xl font-bold">Open the studio →</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              No signup. No setup. Start with a sample project or describe what you want to build.
            </p>
            <Link
              to="/studio"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Launch Studio <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        PakDev Studio · Built with ❤ for Pakistan's developer community
      </footer>
    </div>
  );
}
