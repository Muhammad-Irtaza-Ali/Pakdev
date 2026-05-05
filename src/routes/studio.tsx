import { createFileRoute } from "@tanstack/react-router";
import { IdeShell } from "@/components/ide/IdeShell";

export const Route = createFileRoute("/studio")({
  head: () => ({
    meta: [
      { title: "Studio — PakDev Studio" },
      {
        name: "description",
        content:
          "The PakDev Studio editor: write code, chat with the AI agent, scaffold full projects, and generate bilingual documentation.",
      },
      { property: "og:title", content: "PakDev Studio — AI Code Editor" },
      {
        property: "og:description",
        content:
          "Open the editor: AI chat, refactoring, project scaffolding, and bilingual English/Urdu docs.",
      },
    ],
  }),
  component: StudioPage,
});

function StudioPage() {
  return <IdeShell />;
}
