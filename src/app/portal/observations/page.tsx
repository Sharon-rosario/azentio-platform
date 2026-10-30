import { Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { LinkTabs } from "@/components/learning/bits";
import { Forbidden } from "@/components/portal/forbidden";
import { EmptyState, PageHeader, Panel } from "@/components/states";
import { StatusBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { date } from "@/lib/format";
import { PRODUCT_NAME } from "@/lib/products";
import { getPrincipal } from "@/server/auth";
import { listObservations } from "@/server/learning";
import { isForbidden, load } from "@/server/page";
import { can } from "@/server/policy";

export const metadata: Metadata = { title: "Contributions" };

export default async function ObservationsPage({ searchParams }: PageProps<"/portal/observations">) {
  const p = (await getPrincipal())!;
  const { scope: raw } = await searchParams;
  const orgAllowed = can(p, "observations.org");
  const scope = raw === "org" && orgAllowed ? "org" : "mine";
  const rows = await load((p) => listObservations(p, scope), "/portal/observations");
  if (isForbidden(rows)) return <Forbidden message={rows.forbidden} />;
  const writer = can(p, "observations.write");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contributions"
        description="Market observations from your team. Drafts stay private; only a reviewed, de-identified copy is ever shared outside your organisation."
        actions={
          writer ? (
            <Button render={<Link href="/portal/observations/new" />}>
              <Sparkles /> Share an observation
            </Button>
          ) : undefined
        }
      />

      {orgAllowed && (
        <LinkTabs
          label="Whose contributions"
          items={[
            { href: "/portal/observations?scope=mine", label: "My contributions", active: scope === "mine" },
            { href: "/portal/observations?scope=org", label: "My organisation's", active: scope === "org" },
          ]}
        />
      )}

      <Panel bodyClassName="-mx-2">
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-[12px] font-normal">Title</TableHead>
                {scope === "org" && <TableHead className="text-muted-foreground text-[12px] font-normal">Author</TableHead>}
                <TableHead className="text-muted-foreground text-[12px] font-normal">Category</TableHead>
                <TableHead className="text-muted-foreground text-[12px] font-normal">Offering</TableHead>
                <TableHead className="text-muted-foreground text-[12px] font-normal">Who can see it</TableHead>
                <TableHead className="text-muted-foreground text-[12px] font-normal">Status</TableHead>
                <TableHead className="text-muted-foreground text-right text-[12px] font-normal">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="max-w-[360px] py-3">
                    <Link
                      href={`/portal/observations/${o.id}`}
                      className="focus-visible:ring-ring block truncate rounded-sm text-[14px] font-medium outline-none hover:underline focus-visible:ring-2"
                    >
                      {o.title}
                    </Link>
                  </TableCell>
                  {scope === "org" && <TableCell className="text-[13px]">{o.author}</TableCell>}
                  <TableCell className="text-[13px]">{o.category}</TableCell>
                  <TableCell className="text-[13px]">{PRODUCT_NAME[o.offering] ?? o.offering}</TableCell>
                  <TableCell><StatusBadge value={o.visibility} /></TableCell>
                  <TableCell><StatusBadge value={o.status} /></TableCell>
                  <TableCell className="text-muted-foreground text-right text-[13px] tabular-nums">{date(o.updated_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : scope === "mine" ? (
          <EmptyState
            title="You haven't written any observations yet"
            description="Note a pattern you've seen in your market or with a product. It stays private until you choose to share it."
            action={
              writer ? (
                <Button variant="outline" size="sm" render={<Link href="/portal/observations/new" />}>
                  Write your first observation
                </Button>
              ) : undefined
            }
          />
        ) : (
          <EmptyState
            title="Nothing shared inside your organisation yet"
            description="When colleagues choose “My organisation” or propose an observation for the community, it appears here. Their private drafts never do."
          />
        )}
      </Panel>
    </div>
  );
}
