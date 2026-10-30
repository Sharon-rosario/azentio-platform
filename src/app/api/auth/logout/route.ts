import { signOut } from "@/server/auth";
import { route } from "@/server/http";

export const POST = route(async () => {
  await signOut();
  return { ok: true };
});
