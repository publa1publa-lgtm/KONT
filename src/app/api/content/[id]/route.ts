import { deleteContent, patchContent } from "@/lib/api/handlers/content";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return patchContent(req, ctx.params);
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  return deleteContent(req, ctx.params);
}
