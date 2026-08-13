import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function queryUserIdsByLoginIdentifier(
  isEmail: boolean,
  raw: string,
  loginKey: string,
): Promise<{ id: string }[]> {
  return prisma.$queryRaw<{ id: string }[]>(
    isEmail
      ? Prisma.sql`
          SELECT id FROM "User"
          WHERE "deletedAt" IS NULL
            AND LOWER(email) = LOWER(${raw})
        `
      : Prisma.sql`
          SELECT id FROM "User"
          WHERE "deletedAt" IS NULL
            AND (
              LOWER(COALESCE("login", '')) = ${loginKey}
              OR LOWER(SPLIT_PART(email, '@', 1)) = ${loginKey}
              OR LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9_]', '', 'g')) = ${loginKey}
            )
        `,
  );
}

export async function findUserForPasswordCheck(userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: { id: true, email: true, passwordHash: true },
  });
}

export async function touchUserLastLogin(userId: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
}

export async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserByLogin(login: string) {
  return prisma.user.findUnique({ where: { login } });
}

export async function createUser(data: {
  email: string;
  login: string;
  firstName: string;
  lastName: string;
  marketingOptIn: boolean;
  passwordHash: string;
}) {
  return prisma.user.create({
    data,
    select: { id: true, email: true, createdAt: true },
  });
}

const meSelect = {
  id: true,
  email: true,
  login: true,
  firstName: true,
  lastName: true,
  role: true,
  timezone: true,
  locale: true,
  emailVerifiedAt: true,
  createdAt: true,
  lastLoginAt: true,
} as const;

export async function findUserProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: meSelect,
  });
}

export async function findSessionById(sessionId: string) {
  return prisma.session.findUnique({
    where: { id: sessionId },
    select: { userId: true },
  });
}
