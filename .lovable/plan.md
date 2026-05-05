
# PakDev Studio — Web IDE Plan

A browser-based, AI-first code editor inspired by VS Code, built for Pakistan's developer community. Single-session sandbox: open it, code, get AI help, leave. No sign-in required.

> Note: a true desktop IDE with a locally-running Mistral 7B model isn't possible in a web app. We'll deliver the same end-user experience using **Lovable AI** (Gemini/GPT) on the backend — the user gets the same features (chat agent, code suggestions, scaffolding, bilingual docs) without installing anything.

---

## What gets built

### 1. The IDE shell (dark, VS Code–inspired)
- **Top bar**: PakDev Studio logo/wordmark, project name, "Run" / "Format" actions, language switcher for AI output (English / Urdu).
- **Left activity bar** (icon strip): Files, Search, AI Agent, Docs.
- **File explorer panel**: tree view of the in-memory project; create / rename / delete files & folders; multi-file support.
- **Editor area**: Monaco editor (the same engine VS Code uses) with tabs, syntax highlighting for JS/TS/JSX/TSX/HTML/CSS/JSON/Python/Markdown, dark theme matching the rest of the UI.
- **Right AI panel** (resizable, collapsible): the Agent — chat, scaffold, explain, doc.
- **Bottom panel**: collapsible "Output" tab showing AI status, errors, and a read-only preview of generated/explained content. (No real terminal — that needs a backend sandbox we won't build in v1.)
- All state lives in memory + browser storage for the session. A "Download project as .zip" button lets users keep their work.

### 2. AI Agent panel — four modes
Tabs at the top of the right panel:

1. **Chat** — free-form conversation about the current file or whole project. Sends conversation history + currently-open file contents to the AI. Streams responses with markdown rendering and copy-to-editor buttons on every code block.
2. **Explain & Improve** — select code in the editor → "Explain", "Find bugs", or "Suggest improvements". Returns a structured response: plain-language explanation, list of issues, and a unified diff the user can apply with one click.
3. **Scaffold a project** — big input box: *"Create a React-based e-commerce storefront"*. AI returns a multi-file structure (paths + contents) which is rendered as a preview tree, then "Create project" replaces the workspace with the generated files.
4. **Bilingual docs** — select code or a file → generate parallel English + Urdu documentation. Output shown side-by-side; "Insert as comments" adds it to the file (with `/* */` blocks so Urdu text is preserved). Urdu is rendered RTL with a proper Urdu webfont (Noto Nastaliq Urdu).

### 3. Onboarding
First visit: a small modal welcomes the user to PakDev Studio, explains the four AI modes in one screen, and offers two starting points:
- **Empty project**
- **Try a sample**: pre-loaded "Hello world" React app so the user can immediately try Explain / Improve / Docs.

### 4. Landing/hero on the index route
Brief 1-screen intro → "Launch Studio" button → the IDE itself lives at `/studio`. Keeps SEO-friendly metadata on `/` and the heavy editor only loads when entered.

---

## Pages / routes

```
/             Landing page (hero, features, "Launch Studio" CTA)
/studio       The IDE
```

Each route gets its own `head()` metadata.

---

## Visual direction

- Dark theme: near-black sidebars (`#1e1e1e`-feeling), slightly lighter editor background, blue accent for active states (matching the VS Code mental model but using our own oklch tokens — not literally copying VS Code).
- Monospace for editor & code blocks (JetBrains Mono via Google Fonts).
- Inter for UI text, Noto Nastaliq Urdu for Urdu output.
- Subtle animations on panel collapse, tab switching, AI streaming.
- Fully responsive down to tablet; on phone we show a "best on desktop" notice with a read-only fallback (an IDE on a 375px screen is not useful).

---

## Out of scope for v1 (call out so expectations are set)

- No real code execution / terminal (would require a server sandbox like WebContainers or a backend runner — large separate project).
- No Git integration.
- No multi-user collaboration.
- No saved projects across sessions / no login (per your choice). Users can download their work as a zip.
- No locally-deployed Mistral model — we use Lovable AI (Gemini/GPT) on the backend for equivalent capability with zero setup.

These can all be follow-ups.

---

## Technical notes (for the curious — skip if not your thing)

- Frontend: TanStack Start + React + Tailwind + shadcn, Monaco Editor (`@monaco-editor/react`).
- AI: Lovable Cloud + Lovable AI Gateway. One streaming edge function (`/chat`) for the conversational Agent, and one structured-output edge function (`/scaffold`) that uses tool-calling so we get a clean `{files: [{path, content}]}` JSON back. Bilingual docs and Explain/Improve also use tool-calling for reliable structured returns.
- Default model: `google/gemini-3-flash-preview` (fast, cheap, great quality). Heavier scaffolding requests can route to `google/gemini-2.5-pro`.
- Project state: Zustand store, persisted to `localStorage` so a refresh doesn't nuke work-in-progress.
- Zip export: `jszip` in the browser.
- Urdu RTL handled at the rendered-output level (the editor stays LTR; Urdu only appears in the docs panel and as comment blocks).

---

## Build order

1. Enable Lovable Cloud (needed for the AI gateway key).
2. Landing page at `/` + dark theme tokens + fonts.
3. IDE shell at `/studio`: layout, activity bar, file tree, Monaco editor, tabs, file CRUD, localStorage persistence, zip export.
4. AI Agent panel skeleton with the four tabs.
5. Streaming chat edge function + Chat tab wired up with markdown rendering.
6. Explain & Improve (structured output + apply-diff button).
7. Scaffold a project (structured output + preview tree + "Create project" action).
8. Bilingual docs (structured output, side-by-side EN/UR view, RTL Urdu, insert-as-comments).
9. Onboarding modal + sample project.
10. Polish: empty states, loading states, error toasts (esp. 429 / 402 from the AI gateway), responsive fallback.

This is a substantial app. Once you approve, I'll execute step-by-step, showing progress as each piece comes online so you can steer along the way.
