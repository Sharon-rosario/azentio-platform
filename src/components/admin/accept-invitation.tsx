"use client";

import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/** Accept as the signed-in account. The server checks the email, expiry and single use. */
export function AcceptInvitation({ token }: { token: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      loading={busy}
      onClick={async () => {
        setBusy(true);
        try {
          const res = await api<{ org: string }>(`/api/invitations/${encodeURIComponent(token)}`, "POST");
          toast.success(`You've joined ${res.org}`);
          router.push("/portal");
          router.refresh();
        } catch {
          setBusy(false);
        }
      }}
    >
      <Check /> {busy ? "Joining…" : "Accept invitation"}
    </Button>
  );
}
