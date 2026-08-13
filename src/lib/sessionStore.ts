import { prisma } from "@/lib/prisma";
import { SESSION_TTL_SECONDS, createSessionToken, generateJti, sha256Hex } from "./auth";

export type CreateSessionInput = {
  userId: string;
  ip?: string | null;
  userAgent?: string | null;
};

export type CreatedSession = {
  sessionId: string;
  jti: string;
  token: string;
  expiresAt: Date;
};

export async function createSession(input: CreateSessionInput): Promise<CreatedSession> {
  const jti = generateJti();
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);

  const sess = await prisma.session.create({
    data: {
      userId: input.userId,
      tokenHash: "pending",
      ip: input.ip ?? null,
      userAgent: input.userAgent ?? null,
      expiresAt,
    },
    select: { id: true },
  });

  const tokenHash = sha256Hex(`${sess.id}:${jti}`);
  await prisma.session.update({
    where: { id: sess.id },
    data: { tokenHash },
  });

  const token = createSessionToken({ userId: input.userId, sessionId: sess.id, jti });
  return { sessionId: sess.id, jti, token, expiresAt };
}

export async function revokeSession(sessionId: string, reason: string): Promise<void> {
  await prisma.session
    .updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: reason },
    })
    .catch(() => {});
}
