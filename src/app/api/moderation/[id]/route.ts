import { body, id, oneOf, route } from "@/server/http";
import { publish, reviewItem, sendBack } from "@/server/learning";

export const GET = route<{ id: string }>(({ p, params }) => reviewItem(p, id(params.id)));
export const POST = route<{ id: string }>(async ({ req, p, params }) => {
  const b = await body<{ decision?: unknown; note?: unknown; title?: unknown; body?: unknown; period?: unknown; region?: unknown;
    industry?: unknown; theme_id?: unknown; attribute?: unknown }>(req);
  const decision = oneOf(b.decision, "decision", ["publish", "return", "reject"] as const);
  if (decision === "publish") return publish(p, id(params.id), b);
  return sendBack(p, id(params.id), decision, b.note);
});
