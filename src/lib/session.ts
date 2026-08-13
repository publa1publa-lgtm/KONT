import { cache } from "react";
import { cookies } from "next/headers";

import { prisma } from "@/lib/prisma";
import { cookieName, sha256Hex, verifySessionToken } from "./auth";

export type VerifiedSession = {
  userId: string;
  sessionId: string;
};

export const getVerifiedSession = cache(async (): Promise<VerifiedSession | null> => {
  const token = (await cookies()).get(cookieName())?.value;
  if (!token) return null;

  const decoded = verifySessionToken(token);
  if (!decoded) return null;

  const sess = await prisma.session.findUnique({
    where: { id: decoded.sessionId },
    select: {
      id: true,
      userId: true,
      tokenHash: true,
      revokedAt: true,
      expiresAt: true,
      lastSeenAt: true,
    },
  });
  if (!sess) return null;
  if (sess.userId !== decoded.userId) return null;
  if (sess.revokedAt) return null;
  if (sess.expiresAt.getTime() <= Date.now()) return null;

  const expected = sha256Hex(`${decoded.sessionId}:${decoded.jti}`);
  if (sess.tokenHash !== expected) return null;

  if (Date.now() - sess.lastSeenAt.getTime() > 60_000) {
    void prisma.session
      .update({ where: { id: sess.id }, data: { lastSeenAt: new Date() } })
      .catch(() => {});
  }

  return { userId: sess.userId, sessionId: sess.id };
});

export async function getSessionUserId(): Promise<string | null> {
  const session = await getVerifiedSession();
  return session?.userId ?? null;
}

export async function getCurrentSessionId(): Promise<string | null> {
  const session = await getVerifiedSession();
  return session?.sessionId ?? null;
}
