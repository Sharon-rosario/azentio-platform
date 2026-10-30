import { route } from "@/server/http";
import { synthesize } from "@/server/insights";

export const maxDuration = 120; // the model call can take a while

export const POST = route<{ id: string }>(({ p, params }) => synthesize(p, Number(params.id)));
