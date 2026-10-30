import { route } from "@/server/http";
import { sharedFeed } from "@/server/learning";

export const GET = route(({ req, p }) => {
  const q = new URL(req.url).searchParams;
  const f = (k: string) => q.get(k) || undefined;
  return sharedFeed(p, { q: f("q"), offering: f("offering"), industry: f("industry"), region: f("region"), category: f("category") });
});
