export type AuthUserLike = {
  email: string;
  login?: string | null;
  firstName?: string | null;
  lastName?: string | null;
};

export function userInitials(user: AuthUserLike): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first && last) return `${first[0]}${last[0]}`.toUpperCase();
  if (first && first.length >= 2) return first.slice(0, 2).toUpperCase();
  const email = user.email?.trim();
  if (!email) return "?";
  const local = email.split("@")[0]?.trim() ?? email;
  const cleaned = local.replace(/[._-]+/g, " ");
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  if (local.length >= 2) return local.slice(0, 2).toUpperCase();
  return (local[0] ?? "?").toUpperCase();
}

export function userDisplayName(user: AuthUserLike): string {
  const first = user.firstName?.trim();
  const last = user.lastName?.trim();
  if (first || last) return [first, last].filter(Boolean).join(" ");
  const login = user.login?.trim();
  if (login) return login.startsWith("@") ? login : `@${login}`;
  return user.email;
}
