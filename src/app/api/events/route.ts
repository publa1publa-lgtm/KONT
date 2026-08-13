import { createEvent, listEvents } from "@/lib/api/handlers/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  return listEvents(req);
}

export async function POST(req: Request) {
  return createEvent(req);
}
