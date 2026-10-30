import { route } from "@/server/http";
import { moderationQueue } from "@/server/learning";

export const GET = route(({ p }) => moderationQueue(p));
