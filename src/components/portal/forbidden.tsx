import { Lock } from "lucide-react";
import Link from "next/link";

import { Panel } from "@/components/states";
import { Button } from "@/components/ui/button";

/** What a signed-in user sees when the server refuses an action for their active role. */
export function Forbidden({ message }: { message: string }) {
  return (
    <Panel>
      <div className="mx-auto flex max-w-md flex-col items-center py-10 text-center">
        <span className="bg-muted grid size-12 place-items-center rounded-full">
          <Lock className="text-muted-foreground size-5" strokeWidth={1.75} />
        </span>
        <h1 className="mt-4 text-[20px] leading-7 font-medium tracking-[-0.01em]">{message}</h1>
        <p className="text-muted-foreground mt-2 text-[14px] leading-[22px]">
          Your role in this workspace doesn&apos;t include this page. If you work in more than one organisation, switch
          workspace at the top.
        </p>
        <Button className="mt-6" variant="outline" render={<Link href="/portal" />}>
          Back to your portal
        </Button>
      </div>
    </Panel>
  );
}
