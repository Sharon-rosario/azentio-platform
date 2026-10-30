import { body, route } from "@/server/http";
import { updateIdeaStatus } from "@/server/insights";

export const PATCH = route<{ id: string }>(async ({ req, p, params }) => {
  const b = await body<{ status: string; public_note?: string }>(req);
  return updateIdeaStatus(p, Number(params.id), b.status, b.public_note ?? "");
});
