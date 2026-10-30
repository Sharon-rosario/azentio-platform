import "server-only";

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

// Structured model calls. Production: the Anthropic API (ANTHROPIC_API_KEY), with the output forced through a single
// tool whose input schema is the zod schema. Local development without a key: the Claude Code CLI
// (`claude -p --json-schema`). Either way the result is re-validated with zod and the call fails closed:
// it returns null and a plain reason, never a half-parsed object.

const MODEL = process.env.LLM_MODEL ?? "claude-sonnet-5-5";
const TIMEOUT_MS = 180_000;

function cliPath(): string | null {
  const dirs = (process.env.PATH ?? "").split(process.platform === "win32" ? ";" : ":");
  for (const d of dirs) {
    // On Windows, the npm .cmd shim mangles a JSON argument; call the native exe behind it.
    const exe = join(d, "node_modules", "@anthropic-ai", "claude-code", "bin", "claude.exe");
    if (process.platform === "win32" && existsSync(join(d, "claude.cmd")) && existsSync(exe)) return exe;
    if (process.platform !== "win32" && existsSync(join(d, "claude"))) return join(d, "claude");
  }
  return null;
}

type Result<T> = { data: T | null; note?: string; model: string };

function jsonSchemaOf(schema: z.ZodType): Record<string, unknown> {
  // Neither the API nor the CLI needs zod's "$schema: draft 2020-12" header; the schema itself is plain JSON Schema.
  const { $schema: _draft, ...rest } = z.toJSONSchema(schema) as Record<string, unknown>;
  return rest;
}

async function viaApi<T extends z.ZodType>(prompt: string, schema: T, system: string): Promise<Result<z.infer<T>>> {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic({ timeout: TIMEOUT_MS, maxRetries: 2 });
  try {
    const res = await client.messages.create({
      model: MODEL,
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: prompt }],
      tools: [{ name: "respond", description: "Return the answer in this exact structure.",
        input_schema: jsonSchemaOf(schema) as { type: "object" } }],
      tool_choice: { type: "tool", name: "respond" },
    });
    const block = res.content.find((b) => b.type === "tool_use");
    const parsed = schema.safeParse(block && "input" in block ? block.input : undefined);
    return parsed.success ? { data: parsed.data, model: MODEL } : { data: null, note: "The model's answer didn't match", model: MODEL };
  } catch (e) {
    console.error("anthropic api", e instanceof Error ? e.message : e);
    return { data: null, note: "The model service didn't answer; try again", model: MODEL };
  }
}

export async function parse<T extends z.ZodType>(prompt: string, schema: T, system: string): Promise<Result<z.infer<T>>> {
  if (process.env.ANTHROPIC_API_KEY) return viaApi(prompt, schema, system);
  const cli = cliPath();
  if (!cli) return { data: null, note: "The Claude CLI isn't installed on this server", model: MODEL };
  const jsonSchema = jsonSchemaOf(schema);
  const args = ["-p", "--output-format", "json", "--model", MODEL, "--no-session-persistence", "--tools", "",
    "--system-prompt", system, "--json-schema", JSON.stringify(jsonSchema)];
  const out = await new Promise<{ code: number | null; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(cli, args, { cwd: dirname(cli), windowsHide: true });
    let stdout = "", stderr = "";
    const timer = setTimeout(() => child.kill(), TIMEOUT_MS);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => { clearTimeout(timer); resolve({ code, stdout, stderr }); });
    child.stdin.end(prompt);
  });
  try {
    const res = JSON.parse(out.stdout);
    if (res.is_error || !res.structured_output) return { data: null, note: "Claude couldn't answer in the expected shape", model: MODEL };
    const parsed = schema.safeParse(res.structured_output);
    return parsed.success ? { data: parsed.data, model: MODEL } : { data: null, note: "Claude's answer didn't match", model: MODEL };
  } catch {
    console.error("claude cli", out.code, out.stderr.slice(-500));
    return { data: null, note: "The Claude CLI failed (is it signed in? run `claude` once)", model: MODEL };
  }
}
