import { body, id, route } from "@/server/http";
import { getObservation, updateObservation } from "@/server/learning";

export const GET = route<{ id: string }>(({ p, params }) => getObservation(p, id(params.id)));
export const PATCH = route<{ id: string }>(async ({ req, p, params }) => updateObservation(p, id(params.id), await body(req)));
