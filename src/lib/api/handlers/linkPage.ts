import { NextResponse } from "next/server";

import { linkItemsToJson, validateLinkPagePut } from "@/lib/linkPage";
import { badRequest, conflict, json as jsonResponse } from "@/lib/api/http";
import { requireUser } from "@/lib/api/httpAuth";
import * as linkPageRepo from "@/lib/repos/linkPageRepo";

export async function getLinkPage(): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  const page = await linkPageRepo.findLinkPageByUserId(userId);

  if (!page) {
    return jsonResponse({ linkPage: null });
  }

  return jsonResponse({
    linkPage: {
      handle: page.handle,
      title: page.title,
      bio: page.bio,
      links: page.links,
    },
  });
}

export async function putLinkPage(req: Request): Promise<NextResponse> {
  const userId = await requireUser();
  if (userId instanceof NextResponse) return userId;

  let jsonBody: unknown;
  try {
    jsonBody = await req.json();
  } catch {
    return badRequest("Invalid JSON body");
  }

  const parsed = validateLinkPagePut(jsonBody);
  if (!parsed.ok) {
    return jsonResponse({ error: parsed.error }, parsed.status ?? 400);
  }

  const { handle, title, bio, links } = parsed.value;

  const taken = await linkPageRepo.findLinkPageByHandleForOtherUser(handle, userId);
  if (taken) {
    return conflict("This URL is already taken. Pick another handle.");
  }

  const fresh = await linkPageRepo.upsertLinkPage(userId, {
    handle,
    title,
    bio,
    links: linkItemsToJson(links),
  });

  return jsonResponse({ linkPage: fresh });
}
