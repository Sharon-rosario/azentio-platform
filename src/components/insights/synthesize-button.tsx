"use client";

import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/** Ask AIRA to summarise a theme. Takes ~10 s; the server verifies every quote before saving. */
export function SynthesizeButton({ themeId, hasSummary }: { themeId: number; hasSummary: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const res = await api<{ dropped: number }>(`/api/themes/${themeId}/synthesize`, "POST");
      toast.success(
        res.dropped
          ? `Summary saved. ${res.dropped} quote${res.dropped === 1 ? "" : "s"} couldn't be verified and ${res.dropped === 1 ? "was" : "were"} left out.`
          : "Summary saved. Every quote was checked against its source.",
      );
      router.refresh();
    } catch {
      // api() already showed the error as a toast
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant="outline" size="sm" loading={busy} onClick={run}>
      <Sparkles /> {busy ? "AIRA is reading the contributions…" : hasSummary ? "Summarise again" : "Summarise with AIRA"}
    </Button>
  );
}
