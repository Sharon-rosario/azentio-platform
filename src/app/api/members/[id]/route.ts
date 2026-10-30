import { id, route } from "@/server/http";
import { revokeMember } from "@/server/members";

export const DELETE = route<{ id: string }>(({ p, params }) => revokeMember(p, id(params.id)));
