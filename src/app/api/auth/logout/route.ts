import { postLogout } from "@/lib/api/handlers/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return postLogout(req);
}
