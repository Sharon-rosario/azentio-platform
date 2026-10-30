import "server-only";

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { z } from "zod";

// Claude through the Claude Code CLI (`claude -p --json-schema`), signed in with your own account, so the demo
// needs no API key. Same idea as engines/llm.py in the hackathon kit. Returns null + a reason instead of throwing.

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

export async function parse<T extends z.ZodType>(prompt: string, schema: T, system: string):
  Promise<{ data: z.infer<T> | null; note?: string; model: string }> {
  const cli = cliPath();
  if (!cli) return { data: null, note: "The Claude CLI isn't installed on this server", model: MODEL };
  // The CLI's validator doesn't know zod's "$schema: draft 2020-12" header; the schema itself is plain JSON Schema.
  const { $schema: _draft, ...jsonSchema } = z.toJSONSchema(schema) as Record<string, unknown>;
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
