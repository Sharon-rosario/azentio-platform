import { body, route } from "@/server/http";
import { getObservation, updateObservation } from "@/server/learning";

export const GET = route<{ id: string }>(({ p, params }) => getObservation(p, Number(params.id)));
export const PATCH = route<{ id: string }>(async ({ req, p, params }) => updateObservation(p, Number(params.id), await body(req)));
