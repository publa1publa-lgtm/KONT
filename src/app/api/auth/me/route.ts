import { getMe } from "@/lib/api/handlers/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return getMe();
}
