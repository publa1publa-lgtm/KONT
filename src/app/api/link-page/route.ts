import { getLinkPage, putLinkPage } from "@/lib/api/handlers/linkPage";

export const dynamic = "force-dynamic";

export async function GET() {
  return getLinkPage();
}

export async function PUT(req: Request) {
  return putLinkPage(req);
}
