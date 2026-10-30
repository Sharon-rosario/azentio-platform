"use client";

import { ArrowRight, Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";

export function LoginForm({ next, demo }: { next: string; demo: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [busy, setBusy] = useState(false);
  const [demoCode, setDemoCode] = useState<string | null>(null);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/code", "POST", { email });
      setStep("code");
      if (demo) {
        const mail = (await api<{ to_email: string; body: string }[]>("/api/dev/outbox", "GET"))
          .find((m) => m.to_email === email.trim().toLowerCase());
        setDemoCode(mail?.body.match(/\b(\d{6})\b/)?.[1] ?? null);
      }
    } finally {
      setBusy(false);
    }
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/auth/verify", "POST", { email, code });
      router.push(next);
      router.refresh();
    } catch {
      setBusy(false);
    }
  };

  if (step === "email") {
    return (
      <form onSubmit={send} className="mt-6 space-y-3">
        <label className="block text-[13px] font-medium" htmlFor="email">Work email</label>
        <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com" />
        <Button type="submit" className="w-full" disabled={busy}>
          <Mail /> {busy ? "Sending…" : "Email me a code"}
        </Button>
      </form>
    );
  }
  return (
    <form onSubmit={verify} className="mt-6 space-y-3">
      <p className="text-[14px]">
        We sent a code to <span className="font-medium">{email}</span>. It expires in 10 minutes and works once.
      </p>
      {demo && demoCode && (
        <p className="bg-warning-soft text-warning rounded-[12px] px-3 py-2 text-[13px]">
          Demo mode: not emailed. The code in the outbox is <span className="font-mono font-medium tabular-nums">{demoCode}</span>
        </p>
      )}
      <label className="block text-[13px] font-medium" htmlFor="code">6-digit code</label>
      <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} required value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} className="font-mono tracking-[0.3em]" />
      <Button type="submit" className="w-full" disabled={busy || code.length !== 6}>
        {busy ? "Checking…" : "Sign in"} <ArrowRight />
      </Button>
      <button type="button" className="text-muted-foreground text-[13px] hover:underline" onClick={() => { setStep("email"); setCode(""); }}>
        Use a different email
      </button>
    </form>
  );
}
