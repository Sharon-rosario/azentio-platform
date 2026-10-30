import { DEMO_MODE } from "@/server/auth";
import { route } from "@/server/http";
import { outbox } from "@/server/members";
import { HttpError } from "@/server/policy";

// Demo only: shows what would have been emailed. Off when DEMO_MODE=0.
export const GET = route(() => {
  if (!DEMO_MODE) throw new HttpError(404, "Not found");
  return outbox();
});
