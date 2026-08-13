import { uploadMedia } from "@/lib/api/handlers/upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(req: Request) {
  return uploadMedia(req);
}
