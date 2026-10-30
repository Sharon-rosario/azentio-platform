"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { confirm } from "@/components/confirm";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

/** Remove someone's access. Takes effect on their next request. */
export function RevokeButton({ membershipId, name, org }: { membershipId: number; name: string; org: string }) {
  const router = useRouter();
  return (
    <Button
      variant="ghost"
      size="sm"
      className="text-danger"
      onClick={() =>
        confirm({
          title: `Revoke ${name}'s access?`,
          description: `${name} loses access to ${org} on their next request. Their past contributions stay as they are. To give access back, send a new invitation.`,
          confirmLabel: "Revoke access",
          busyLabel: "Revoking…",
          tone: "danger",
          onConfirm: async () => {
            await api(`/api/members/${membershipId}`, "DELETE");
            toast.success(`${name}'s access was revoked`);
            router.refresh();
          },
        })
      }
    >
      Revoke
    </Button>
  );
}
