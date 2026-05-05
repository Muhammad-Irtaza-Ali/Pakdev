// Structured AI tool calls for: explain, scaffold, docs (bilingual)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TOOLS: Record<string, any> = {
  explain: {
    type: "function",
    function: {
      name: "explain_code",
      description: "Explain the given code, list bugs/issues, and suggest improvements with replacement code.",
      parameters: {
        type: "object",
        properties: {
          summary: { type: "string", description: "1-3 sentence plain-language summary of what the code does." },
          walkthrough: {
            type: "array",
            description: "Ordered bullet points walking through important parts.",
            items: { type: "string" },
          },
          issues: {
            type: "array",
            description: "Bugs or problems detected.",
            items: {
              type: "object",
              properties: {
                severity: { type: "string", enum: ["info", "warning", "error"] },
                title: { type: "string" },
                detail: { type: "string" },
              },
              required: ["severity", "title", "detail"],
              additionalProperties: false,
            },
          },
          improvedCode: {
            type: "string",
            description: "Optional improved/refactored version of the entire snippet. Empty string if no rewrite needed.",
          },
        },
        required: ["summary", "walkthrough", "issues", "improvedCode"],
        additionalProperties: false,
      },
    },
  },
  scaffold: {
    type: "function",
    function: {
      name: "scaffold_project",
      description: "Generate a complete starter project as a list of files with paths and full contents.",
      parameters: {
        type: "object",
        properties: {
          name: { type: "string", description: "Suggested project name (kebab-case)." },
          description: { type: "string", description: "Short description of the project." },
          files: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string", description: "Relative file path, e.g. src/App.tsx" },
                content: { type: "string", description: "Full file contents." },
              },
              required: ["path", "content"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "description", "files"],
        additionalProperties: false,
      },
    },
  },
  docs: {
    type: "function",
    function: {
      name: "bilingual_docs",
      description: "Produce parallel English and Urdu documentation for the given code.",
      parameters: {
        type: "object",
        properties: {
          english: {
            type: "object",
            properties: {
              overview: { type: "string" },
              parameters: { type: "array", items: { type: "string" } },
              returns: { type: "string" },
              example: { type: "string" },
            },
            required: ["overview", "parameters", "returns", "example"],
            additionalProperties: false,
          },
          urdu: {
            type: "object",
            description: "Same structure as english but written in proper Urdu (Nastaliq script).",
            properties: {
              overview: { type: "string" },
              parameters: { type: "array", items: { type: "string" } },
              returns: { type: "string" },
              example: { type: "string" },
            },
            required: ["overview", "parameters", "returns", "example"],
            additionalProperties: false,
          },
        },
        required: ["english", "urdu"],
        additionalProperties: false,
      },
    },
  },
};

const SYSTEMS: Record<string, string> = {
  explain:
    "You are an expert code reviewer. Analyze the provided code carefully. Always call the `explain_code` tool. Be specific and actionable.",
  scaffold:
    "You are a senior full-stack engineer. Generate a complete, runnable starter project matching the user's request. Always call the `scaffold_project` tool. Include a README.md, package.json (if applicable), and all source files needed to run the app. Prefer modern React + Vite + TypeScript + Tailwind unless the user specifies otherwise. Keep total files reasonable (8-20).",
  docs:
    "You are a technical writer fluent in English and Urdu. Produce parallel documentation for the provided code. Always call the `bilingual_docs` tool. Urdu must be written in proper Nastaliq Urdu script (right-to-left), not Roman Urdu.",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { mode, prompt, code, model } = await req.json();
    if (!mode || !TOOLS[mode]) throw new Error("Invalid mode");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const userContent =
      mode === "scaffold"
        ? `User request: ${prompt}`
        : `${prompt ? `User request: ${prompt}\n\n` : ""}Code:\n\`\`\`\n${code ?? ""}\n\`\`\``;

    const tool = TOOLS[mode];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model || (mode === "scaffold" ? "google/gemini-2.5-pro" : "google/gemini-3-flash-preview"),
        messages: [
          { role: "system", content: SYSTEMS[mode] },
          { role: "user", content: userContent },
        ],
        tools: [tool],
        tool_choice: { type: "function", function: { name: tool.function.name } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit reached, please try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await resp.text();
      console.error("ai-tool gateway error:", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const call = data?.choices?.[0]?.message?.tool_calls?.[0];
    if (!call) {
      console.error("No tool call returned", JSON.stringify(data).slice(0, 500));
      return new Response(JSON.stringify({ error: "AI did not return structured output." }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(call.function.arguments);
    } catch (e) {
      return new Response(JSON.stringify({ error: "Failed to parse AI output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ result: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-tool error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
