import type { AppMessages } from "@/i18n/messages";
import type { AuthErrorCode } from "@/lib/auth/validation";

export function authErrorMessage(
  messages: AppMessages["auth"]["validation"],
  code?: AuthErrorCode | string | null,
): string | undefined {
  if (!code) return undefined;
  if (code in messages) return messages[code as AuthErrorCode];
  return undefined;
}
