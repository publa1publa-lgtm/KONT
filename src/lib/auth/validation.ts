export const LOGIN_RE = /^[a-z0-9_]{3,30}$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const NAME_MAX = 80;
export const PASSWORD_MIN = 8;

export type AuthErrorCode =
  | "required"
  | "identifierRequired"
  | "invalidEmail"
  | "passwordMin"
  | "passwordsMismatch"
  | "nameRequired"
  | "loginPattern"
  | "emailTaken"
  | "loginTaken"
  | "invalidCredentials"
  | "ambiguousLogin";

export type LoginField = "email" | "password";
export type RegisterField =
  | "firstName"
  | "lastName"
  | "login"
  | "email"
  | "password"
  | "passwordConfirm";

export type FieldErrors<K extends string> = Partial<Record<K, AuthErrorCode>>;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value.trim());
}

export function validateLoginFields(
  identifier: string,
  password: string,
): FieldErrors<LoginField> {
  const fieldErrors: FieldErrors<LoginField> = {};
  const id = identifier.trim();

  if (!id) {
    fieldErrors.email = "identifierRequired";
  } else if (id.includes("@")) {
    if (!isValidEmail(id)) fieldErrors.email = "invalidEmail";
  } else if (id.length < 3) {
    fieldErrors.email = "identifierRequired";
  }

  if (!password) fieldErrors.password = "required";

  return fieldErrors;
}

export type RegisterValues = {
  firstName: string;
  lastName: string;
  login: string;
  email: string;
  password: string;
  passwordConfirm: string;
};

export function normalizeLogin(raw: string): string {
  return raw.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

export function validateRegisterFields(values: RegisterValues): FieldErrors<RegisterField> {
  const fieldErrors: FieldErrors<RegisterField> = {};
  const firstName = values.firstName.trim();
  const lastName = values.lastName.trim();
  const login = values.login.trim().toLowerCase();
  const email = values.email.trim().toLowerCase();

  if (!firstName) fieldErrors.firstName = "nameRequired";
  else if (firstName.length > NAME_MAX) fieldErrors.firstName = "nameRequired";

  if (!lastName) fieldErrors.lastName = "nameRequired";
  else if (lastName.length > NAME_MAX) fieldErrors.lastName = "nameRequired";

  if (!LOGIN_RE.test(login)) fieldErrors.login = "loginPattern";

  if (!email) fieldErrors.email = "required";
  else if (!isValidEmail(email)) fieldErrors.email = "invalidEmail";

  if (!values.password) fieldErrors.password = "required";
  else if (values.password.length < PASSWORD_MIN) fieldErrors.password = "passwordMin";

  if (!values.passwordConfirm) fieldErrors.passwordConfirm = "required";
  else if (values.password && values.password !== values.passwordConfirm) {
    fieldErrors.passwordConfirm = "passwordsMismatch";
  }

  return fieldErrors;
}

export function firstError<K extends string>(
  fieldErrors: FieldErrors<K>,
): AuthErrorCode | undefined {
  return Object.values(fieldErrors)[0] as AuthErrorCode | undefined;
}

export function hasFieldErrors<K extends string>(fieldErrors: FieldErrors<K>): boolean {
  return Object.keys(fieldErrors).length > 0;
}

export function loginErrorCode(message: string): AuthErrorCode {
  if (message.includes("Several accounts")) return "ambiguousLogin";
  if (message.toLowerCase().includes("required")) return "identifierRequired";
  return "invalidCredentials";
}
