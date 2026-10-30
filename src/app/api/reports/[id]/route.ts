import { body, id, oneOf, route } from "@/server/http";
import { decideReport } from "@/server/learning";

export const POST = route<{ id: string }>(async ({ req, p, params }) => {
  const b = await body<{ decision: string; note?: string }>(req);
  return decideReport(p, id(params.id), oneOf(b.decision, "decision", ["restore", "remove"] as const), b.note ?? "");
});
