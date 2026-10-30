import { createContent, listContent } from "@/server/content";
import { body, route } from "@/server/http";

export const GET = route(({ req, p }) => listContent(p, new URL(req.url).searchParams.get("kind") ?? undefined));
export const POST = route(async ({ req, p }) => ({ id: await createContent(p, await body(req)) }));
