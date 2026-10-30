import { body, route } from "@/server/http";
import { createObservation, listObservations } from "@/server/learning";

export const GET = route(({ req, p }) =>
  listObservations(p, new URL(req.url).searchParams.get("scope") === "org" ? "org" : "mine"));
export const POST = route(async ({ req, p }) => ({ id: await createObservation(p, await body(req)) }));
