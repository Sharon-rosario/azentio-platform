import { autoModerate } from "@/server/autopilot";
import { id, route } from "@/server/http";

export const maxDuration = 120; // one AIRA call plus the publish

export const POST = route<{ id: string }>(({ p, params }) => autoModerate(p, id(params.id)));
