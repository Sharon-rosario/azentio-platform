"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Banner } from "@/components/banner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";

type Option = { value: string; label: string };

/**
 * Invite by email. Client admins get client roles only; portal admins get every role and choose the organisation.
 * The server enforces both, whatever this form offers.
 */
export function InviteForm({ roles, orgs, defaultOrgId }: { roles: Option[]; orgs?: Option[]; defaultOrgId?: number }) {
  const router = useRouter();
  const id = useId();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState(roles[0]?.value ?? "");
  const [org, setOrg] = useState(defaultOrgId ? String(defaultOrgId) : (orgs?.[0]?.value ?? ""));
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api("/api/members", "POST", { email, role, ...(orgs ? { orgId: Number(org) } : {}) });
      toast.success(`Invitation created for ${email.trim()}`);
      setSentTo(email.trim());
      setEmail("");
      router.refresh();
    } catch {
      // toast already shown
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-email`} className="text-[13px] font-medium">Email</label>
        <Input id={`${id}-email`} type="email" required autoComplete="off" value={email} onChange={(e) => setEmail(e.target.value)}
          placeholder="name@company.com" className="h-10" />
      </div>
      <div className="grid gap-1.5">
        <label htmlFor={`${id}-role`} className="text-[13px] font-medium">Role</label>
        <Select items={roles} value={role} onValueChange={(v) => v && setRole(v)}>
          <SelectTrigger id={`${id}-role`} className="w-full"><SelectValue /></SelectTrigger>
          <SelectContent>
            {roles.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {orgs && (
        <div className="grid gap-1.5">
          <label htmlFor={`${id}-org`} className="text-[13px] font-medium">Organisation</label>
          <Select items={orgs} value={org} onValueChange={(v) => v && setOrg(v)}>
            <SelectTrigger id={`${id}-org`} className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {orgs.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}
      <div>
        <Button type="submit" loading={busy} disabled={!email.trim() || !role}>
          <Send /> {busy ? "Creating…" : "Send invitation"}
        </Button>
      </div>
      {sentTo && (
        <Banner tone="info" onDismiss={() => setSentTo(null)}>
          Invitation link created for {sentTo}. In this demo it&apos;s in the outbox, not emailed.
        </Banner>
      )}
      <p className="text-muted-foreground text-[12px]">
        The link works once, expires in 7 days, and only for this email address after it signs in.
      </p>
    </form>
  );
}
