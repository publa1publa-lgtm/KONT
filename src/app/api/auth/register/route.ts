import { postRegister } from "@/lib/api/handlers/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  return postRegister(req);
}
