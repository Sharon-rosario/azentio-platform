import { body, id, route } from "@/server/http";
import { submitObservation } from "@/server/learning";

export const POST = route<{ id: string }>(async ({ req, p, params }) =>
  submitObservation(p, id(params.id), await body<{ publish?: boolean; attribute?: boolean; train?: boolean }>(req)));
