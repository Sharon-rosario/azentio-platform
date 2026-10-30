import { route } from "@/server/http";
import { acceptInvitation } from "@/server/members";

export const POST = route<{ token: string }>(async ({ p, params }) => ({ org: await acceptInvitation(p, params.token) }));
