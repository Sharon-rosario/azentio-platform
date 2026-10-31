import { listRequests } from "@/server/content";
import { route } from "@/server/http";

export const GET = route(({ p }) => listRequests(p));
