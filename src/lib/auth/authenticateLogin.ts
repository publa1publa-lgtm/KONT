import * as userRepo from "@/lib/repos/userRepo";
import { verifyPassword } from "@/lib/auth";

export type AuthenticateLoginResult =
  | { ok: true; userId: string; email: string }
  | { ok: false; error: string; status: number };

export async function authenticateLogin(
  identifier: string,
  password: string,
): Promise<AuthenticateLoginResult> {
  const raw = identifier.trim();
  if (!raw || !password) {
    return { ok: false, error: "Email and password are required", status: 400 };
  }

  const isEmail = raw.includes("@");
  const loginKey = raw.toLowerCase().replace(/[^a-z0-9_]/g, "");
  if (!isEmail && !loginKey) {
    return { ok: false, error: "Email and password are required", status: 400 };
  }

  const idRows = await userRepo.queryUserIdsByLoginIdentifier(isEmail, raw, loginKey);

  if (idRows.length > 1) {
    return {
      ok: false,
      error: "Several accounts match this name. Sign in with your full email address.",
      status: 400,
    };
  }

  const user =
    idRows.length === 1 ? await userRepo.findUserForPasswordCheck(idRows[0].id) : null;

  if (!user) {
    return { ok: false, error: "Invalid email, login, or password", status: 401 };
  }

  const passwordOk = await verifyPassword(password, user.passwordHash);
  if (!passwordOk) {
    return { ok: false, error: "Invalid email, login, or password", status: 401 };
  }

  return { ok: true, userId: user.id, email: user.email };
}
