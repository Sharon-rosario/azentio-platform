import { body, route } from "@/server/http";
import { submitObservation } from "@/server/learning";

export const POST = route<{ id: string }>(async ({ req, p, params }) =>
  submitObservation(p, Number(params.id), await body<{ publish?: boolean; attribute?: boolean; train?: boolean }>(req)));
