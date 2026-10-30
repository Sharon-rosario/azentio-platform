import { route } from "@/server/http";
import { revokeMember } from "@/server/members";

export const DELETE = route<{ id: string }>(({ p, params }) => revokeMember(p, Number(params.id)));
