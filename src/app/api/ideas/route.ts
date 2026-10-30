import { body, route } from "@/server/http";
import { createIdea, listIdeas } from "@/server/insights";

export const GET = route(({ p }) => listIdeas(p));
export const POST = route(async ({ req, p }) => ({ id: await createIdea(p, await body(req)) }));
