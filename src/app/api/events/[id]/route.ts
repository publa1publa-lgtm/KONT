import { deleteEvent, patchEvent } from "@/lib/api/handlers/events";

export const dynamic = "force-dynamic";

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return patchEvent(req, ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return deleteEvent(req, ctx.params);
}
