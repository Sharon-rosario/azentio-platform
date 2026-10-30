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

      <div className="grid items-start gap-6 lg:grid-cols-12">
      <Panel bodyClassName="-mx-2" className="min-w-0 lg:col-span-8">
        {rows.length ? (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-muted-foreground text-[12px] font-normal">Title</TableHead>
                {scope === "org" && <TableHead className="hidden md:table-cell text-muted-foreground text-[12px] font-normal">Author</TableHead>}
                <TableHead className="hidden 2xl:table-cell text-muted-foreground text-[12px] font-normal">Category</TableHead>
                <TableHead className="hidden xl:table-cell text-muted-foreground text-[12px] font-normal">Offering</TableHead>
                <TableHead className="hidden sm:table-cell text-muted-foreground text-[12px] font-normal">Who can see it</TableHead>
                <TableHead className="hidden sm:table-cell text-muted-foreground text-[12px] font-normal">Status</TableHead>
                <TableHead className="hidden text-right sm:table-cell text-muted-foreground text-[12px] font-normal">Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((o) => (
                <TableRow key={o.id}>
                  <TableCell className="py-3 whitespace-normal sm:max-w-[360px]">
                    <Link
                      href={`/portal/observations/${o.id}`}
                      className="focus-visible:ring-ring block rounded-sm text-[14px] font-medium outline-none hover:underline focus-visible:ring-2 sm:truncate"
                    >
                      {o.title}
                    </Link>
                    {/* Phones: the columns below are hidden, so status and audience sit under the title. */}
                    <div className="mt-1.5 flex flex-wrap gap-1.5 sm:hidden">
                      <StatusBadge value={o.status} />
                      <StatusBadge value={o.visibility} />
                    </div>
                  </TableCell>
                  {scope === "org" && <TableCell className="hidden text-[13px] md:table-cell">{o.author}</TableCell>}
                  <TableCell className="hidden text-[13px] 2xl:table-cell">{o.category}</TableCell>
                  <TableCell className="hidden text-[13px] xl:table-cell">{PRODUCT_NAME[o.offering] ?? o.offering}</TableCell>
                  <TableCell className="hidden sm:table-cell"><StatusBadge value={o.visibility} /></TableCell>
                  <TableCell className="hidden sm:table-cell"><StatusBadge value={o.status} /></TableCell>
                  <TableCell className="text-muted-foreground hidden text-right text-[13px] tabular-nums sm:table-cell">{date(o.updated_at)}</TableCell>
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

      <aside className="space-y-6 lg:col-span-4">
        {rows.length > 0 && (
          <Panel title="At a glance" description={scope === "org" ? "Your organisation's contributions" : "Your contributions"}>
            <ul className="-my-1 divide-y">
              {GLANCE.map(([status, label]) => (
                <li key={status} className="flex items-center justify-between gap-3 py-2.5">
                  <span className="flex items-center gap-2.5 text-[14px]"><StatusBadge value={status} /> <span className="text-muted-foreground text-[13px]">{label}</span></span>
                  <span className="text-[18px] font-semibold tabular-nums">{rows.filter((o) => o.status === status).length}</span>
                </li>
              ))}
            </ul>
          </Panel>
        )}
        <Panel title="How a contribution travels" description="Nothing leaves your organisation without your say">
          <ol className="relative space-y-4 before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-px before:bg-border">
            {JOURNEY.map(([title, body], i) => (
              <li key={title} className="relative flex gap-3">
                <span className="bg-navy text-brand relative grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-semibold">{i + 1}</span>
                <div>
                  <p className="text-[14px] leading-6 font-medium">{title}</p>
                  <p className="text-muted-foreground text-[13px] leading-5">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </Panel>
        <Panel title="Your rights">
          <ul className="text-muted-foreground space-y-2 text-[13px] leading-5">
            <li><span className="text-foreground font-medium">Withdraw at any time.</span> The shared copy leaves the feed, search and AIRA at once.</li>
            <li><span className="text-foreground font-medium">Consent per purpose.</span> Publishing, naming your organisation and model training are separate choices.</li>
            <li><span className="text-foreground font-medium">Edits are re-reviewed.</span> Changing a published contribution sends it back to a moderator.</li>
          </ul>
        </Panel>
      </aside>
      </div>
    </div>
  );
}

const GLANCE: [string, string][] = [
  ["draft", "Private drafts"],
  ["returned", "Need a change"],
  ["submitted", "With a moderator"],
  ["published", "In shared learning"],
  ["withdrawn", "Withdrawn"],
];

const JOURNEY: [string, string][] = [
  ["Draft", "Saved privately, or for colleagues in your organisation."],
  ["Submit", "You choose what you allow: publish, name your organisation, training."],
  ["Review", "A learning moderator removes identifying detail, or returns it with a note."],
  ["Shared", "A separate, de-identified copy joins shared learning and themes."],
];
