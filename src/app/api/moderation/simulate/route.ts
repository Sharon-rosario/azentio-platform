import { simulateQueue } from "@/server/autopilot";
import { body, route } from "@/server/http";

export const POST = route(async ({ req, p }) => simulateQueue(p, Number((await body<{ count?: unknown }>(req)).count)));
