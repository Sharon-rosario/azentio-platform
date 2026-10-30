import { route } from "@/server/http";
import { listThemes } from "@/server/insights";

export const GET = route(({ p }) => listThemes(p));
