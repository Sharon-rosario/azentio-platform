import { aiCheck } from "@/server/ai-check";
import { body, id, route } from "@/server/http";

export const maxDuration = 120; // the model call can take a while

export const POST = route<{ id: string }>(async ({ req, p, params }) => aiCheck(p, id(params.id), await body(req)));
