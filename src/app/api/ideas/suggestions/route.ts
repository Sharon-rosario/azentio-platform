import { body, route } from "@/server/http";
import { suggestIdea } from "@/server/insights";

export const POST = route(async ({ req, p }) => ({ id: await suggestIdea(p, await body(req)) }));
