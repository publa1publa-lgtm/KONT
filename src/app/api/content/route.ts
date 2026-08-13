import { createContent, listContent } from "@/lib/api/handlers/content";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listContent(req);
}

export async function POST(req: Request) {
  return createContent(req);
}
