import { route } from "@/server/http";
import { feedFacets } from "@/server/learning";

/** The filter values the shared feed offers: published copies only, under the same rules as the feed. */
export const GET = route(({ p }) => feedFacets(p));
