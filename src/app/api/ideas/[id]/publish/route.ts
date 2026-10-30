import { body, id, route } from "@/server/http";
import { publishIdea } from "@/server/insights";

export const POST = route<{ id: string }>(async ({ req, p, params }) => {
  const b = await body<{ theme_id?: unknown }>(req);
  return publishIdea(p, id(params.id), b.theme_id);
});
