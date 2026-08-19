import { createEvent, listEvents } from "@/lib/api/handlers/events";
import { withRateLimit } from "@/lib/api/withRateLimit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listEvents(req);
}

export const POST = withRateLimit("events:create", { limit: 60, windowMs: 15 * 60_000 }, createEvent);
