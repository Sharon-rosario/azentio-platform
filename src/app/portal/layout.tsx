import { redirect } from "next/navigation";

import { ConfirmHost } from "@/components/confirm";
import { TopPanel } from "@/components/portal/top-panel";
import { getPrincipal } from "@/server/auth";
import { one } from "@/server/db";
import { signInPath } from "@/server/page";

export default async function PortalLayout({ children }: LayoutProps<"/portal">) {
  const p = await getPrincipal();
  if (!p) redirect(await signInPath("/portal"));
  const unread = (await one<{ n: number }>("select count(*)::int as n from notifications where user_id = ? and read_at is null", p.userId))?.n ?? 0;
  return (
    <div className="flex min-h-svh flex-col">
      <TopPanel p={p} unread={unread} />
      <main id="main" className="mx-auto w-full max-w-[1280px] flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
      <ConfirmHost />
    </div>
  );
}
