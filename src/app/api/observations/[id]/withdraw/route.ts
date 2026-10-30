import { id, route } from "@/server/http";
import { withdrawObservation } from "@/server/learning";

export const POST = route<{ id: string }>(({ p, params }) => withdrawObservation(p, id(params.id)));
