"use client";

import { toast } from "sonner";

/** Call our API from the browser. Errors come back as {detail}; they're shown as a toast and re-thrown. */
export async function api<T = unknown>(path: string, method = "POST", body?: unknown): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = (data as { detail?: string }).detail ?? `Request failed (${res.status})`;
    toast.error(message);
    throw new Error(message);
  }
  return data as T;
}
