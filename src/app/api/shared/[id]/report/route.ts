import { body, route } from "@/server/http";
import { report } from "@/server/learning";

export const POST = route<{ id: string }>(async ({ req, p, params }) =>
  report(p, Number(params.id), (await body<{ reason: string }>(req)).reason ?? ""));
