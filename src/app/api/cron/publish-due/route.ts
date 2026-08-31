import { verifyCronSecret } from "@/lib/api/cronAuth";
import { json } from "@/lib/api/http";
import { processDuePublishJobs } from "@/lib/publish/schedule";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: Request) {
  if (!verifyCronSecret(req)) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const result = await processDuePublishJobs(20);
    return json(result);
  } catch (err) {
    console.error("[cron/publish-due]", err);
    return new Response("Internal Server Error", { status: 500 });
  }
}
