import { route } from "@/server/http";
import { auditLog } from "@/server/members";

export const GET = route(({ p }) => auditLog(p));
