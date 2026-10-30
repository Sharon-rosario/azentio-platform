import { route } from "@/server/http";
import { myNotifications } from "@/server/members";

export const GET = route(({ p }) => myNotifications(p));
