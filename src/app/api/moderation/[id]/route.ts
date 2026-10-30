import { body, id, oneOf, route } from "@/server/http";
import { publish, reviewItem, sendBack } from "@/server/learning";

export const GET = route<{ id: string }>(({ p, params }) => reviewItem(p, id(params.id)));
export const POST = route<{ id: string }>(async ({ req, p, params }) => {
  const b = await body<{ decision: string; note?: string; title?: string; body?: string; period?: string; region?: string;
    theme_id?: number | null; attribute?: boolean }>(req);
  const decision = oneOf(b.decision, "decision", ["publish", "return", "reject"] as const);
  if (decision === "publish") return publish(p, id(params.id), b);
  return sendBack(p, id(params.id), decision, b.note ?? "");
});
