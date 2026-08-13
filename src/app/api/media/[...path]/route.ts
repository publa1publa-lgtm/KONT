import { getMediaByStoragePath } from "@/lib/api/handlers/mediaProxy";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return getMediaByStoragePath(ctx.params);
}
