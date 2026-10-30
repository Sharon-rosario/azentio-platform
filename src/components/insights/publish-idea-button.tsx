"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { confirm } from "@/components/confirm";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/** A product owner makes an internal suggestion visible to clients: its title, status and public note only. */
export function PublishIdeaButton({ ideaId }: { ideaId: number }) {
  const router = useRouter();
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() =>
        confirm({
          title: "Show this idea to clients?",
          description: "Clients will see its title, product, theme, status and public note. The problem and internal fields stay with Azentio.",
          confirmLabel: "Show to clients",
          busyLabel: "Publishing…",
          onConfirm: async () => {
            await api(`/api/ideas/${ideaId}/publish`, "POST", {});
            toast.success("Now visible to clients");
            router.refresh();
          },
        })
      }
    >
      <Send /> Show to clients
    </Button>
  );
}
