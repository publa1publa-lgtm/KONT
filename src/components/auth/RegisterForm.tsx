"use client";

import Link from "next/link";
import { useActionState, useId, useMemo, useRef, useState, type FormEvent } from "react";

import { authErrorMessage } from "@/components/auth/authErrors";
import { authInputClass } from "@/components/auth/authFormStyles";
import { FieldError } from "@/components/auth/FieldError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useI18n } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import { withLocale } from "@/i18n/config";
import { registerAction, type AuthActionState } from "@/lib/actions/auth";
import {
  type RegisterField,
  hasFieldErrors,
  validateRegisterFields,
} from "@/lib/auth/validation";

export function RegisterForm({
  onRequestSignIn,
  className = "",
  showHeader = true,
  compact = false,
  next = null,
}: {
  onRequestSignIn?: () => void;
  className?: string;
  showHeader?: boolean;
  compact?: boolean;
  next?: string | null;
}) {
  const { auth } = useMessages();
  const { locale } = useI18n();
  const R = auth.register;
  const V = auth.validation;
  const uid = useId();
  const loginHref = (() => {
    const path = withLocale(locale, "/login");
    return next ? `${path}?next=${encodeURIComponent(next)}` : path;
  })();
  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    registerAction,
    null,
  );
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    login: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [touched, setTouched] = useState<Partial<Record<RegisterField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const lastSubmit = useRef(values);

  const clientErrors = useMemo(() => validateRegisterFields(values), [values]);

  const setField = (field: RegisterField, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]: field === "login" ? value.toLowerCase() : value,
    }));
  };

  const touch = (field: RegisterField) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const errorFor = (field: RegisterField) => {
    if (!(touched[field] || submitted)) return undefined;
    const unchanged = values[field] === lastSubmit.current[field];
    const serverCode = unchanged ? state?.fieldErrors?.[field] : undefined;
    return authErrorMessage(V, clientErrors[field] ?? serverCode);
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    lastSubmit.current = { ...values };
    if (hasFieldErrors(clientErrors)) event.preventDefault();
  };

  const firstNameError = errorFor("firstName");
  const lastNameError = errorFor("lastName");
  const loginError = errorFor("login");
  const emailError = errorFor("email");
  const passwordError = errorFor("password");
  const confirmError = errorFor("passwordConfirm");

  return (
    <div className={className}>
      {showHeader ? (
        <div className="relative mb-6">
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[var(--electric)]/20 via-[var(--ice)]/15 to-[var(--ember)]/10 blur-lg" aria-hidden />
          <div className="relative">
            <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{R.brand}</div>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-[var(--fg)] sm:text-[1.65rem]">{R.title}</h2>
            <p className="mt-1.5 max-w-md text-sm leading-relaxed text-[var(--muted)]">{R.subtitle}</p>
          </div>
        </div>
      ) : null}

      <form
        className={compact ? "grid gap-2.5" : "grid gap-4"}
        action={formAction}
        noValidate
        onSubmit={onSubmit}
      >
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className={compact ? "grid gap-2.5 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.firstName}</span>
            <input
              id={`${uid}-firstName`}
              name="firstName"
              type="text"
              autoComplete="given-name"
              className={authInputClass(Boolean(firstNameError))}
              placeholder={R.placeholders.firstName}
              maxLength={80}
              value={values.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              onBlur={() => touch("firstName")}
              aria-invalid={Boolean(firstNameError)}
              aria-describedby={firstNameError ? `${uid}-firstName-error` : undefined}
            />
            <FieldError id={`${uid}-firstName-error`} message={firstNameError} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.lastName}</span>
            <input
              id={`${uid}-lastName`}
              name="lastName"
              type="text"
              autoComplete="family-name"
              className={authInputClass(Boolean(lastNameError))}
              placeholder={R.placeholders.lastName}
              maxLength={80}
              value={values.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              onBlur={() => touch("lastName")}
              aria-invalid={Boolean(lastNameError)}
              aria-describedby={lastNameError ? `${uid}-lastName-error` : undefined}
            />
            <FieldError id={`${uid}-lastName-error`} message={lastNameError} />
          </label>
        </div>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.login}</span>
          <input
            id={`${uid}-login`}
            name="login"
            type="text"
            autoComplete="username"
            className={authInputClass(Boolean(loginError))}
            placeholder={R.placeholders.login}
            maxLength={30}
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            value={values.login}
            onChange={(e) => setField("login", e.target.value)}
            onBlur={() => touch("login")}
            aria-invalid={Boolean(loginError)}
            aria-describedby={loginError ? `${uid}-login-error` : `${uid}-login-hint`}
          />
          <FieldError id={`${uid}-login-error`} message={loginError} />
          {compact || loginError ? null : (
            <span id={`${uid}-login-hint`} className="text-[11px] text-[var(--muted)]/90">
              {R.loginHint}
            </span>
          )}
        </label>

        <label className="grid gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.email}</span>
          <input
            id={`${uid}-email`}
            name="email"
            type="email"
            autoComplete="email"
            className={authInputClass(Boolean(emailError))}
            placeholder={R.placeholders.email}
            value={values.email}
            onChange={(e) => setField("email", e.target.value)}
            onBlur={() => touch("email")}
            aria-invalid={Boolean(emailError)}
            aria-describedby={emailError ? `${uid}-email-error` : undefined}
          />
          <FieldError id={`${uid}-email-error`} message={emailError} />
        </label>

        <div className={compact ? "grid gap-2.5 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2"}>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.password}</span>
            <PasswordInput
              id={`${uid}-password`}
              name="password"
              autoComplete="new-password"
              className={authInputClass(Boolean(passwordError))}
              placeholder={R.placeholders.password}
              showLabel={auth.showPassword}
              hideLabel={auth.hidePassword}
              value={values.password}
              onChange={(e) => setField("password", e.target.value)}
              onBlur={() => touch("password")}
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? `${uid}-password-error` : undefined}
            />
            <FieldError id={`${uid}-password-error`} message={passwordError} />
          </label>
          <label className="grid gap-1.5">
            <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[var(--muted)]">{R.confirmPassword}</span>
            <PasswordInput
              id={`${uid}-passwordConfirm`}
              name="passwordConfirm"
              autoComplete="new-password"
              className={authInputClass(Boolean(confirmError))}
              placeholder={R.placeholders.confirmPassword}
              showLabel={auth.showPassword}
              hideLabel={auth.hidePassword}
              value={values.passwordConfirm}
              onChange={(e) => setField("passwordConfirm", e.target.value)}
              onBlur={() => touch("passwordConfirm")}
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? `${uid}-passwordConfirm-error` : undefined}
            />
            <FieldError id={`${uid}-passwordConfirm-error`} message={confirmError} />
          </label>
        </div>

        <label className="group flex cursor-pointer items-start gap-2.5 rounded-xl border border-[rgba(0,113,227,0.12)] bg-white/70 p-2.5 transition hover:border-[rgba(0,113,227,0.22)] hover:bg-white">
          <input
            name="marketingOptIn"
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-[rgba(0,113,227,0.28)] bg-white text-[#0071e3] accent-[#0071e3] focus:ring-2 focus:ring-[#32ade6]/30"
          />
          <span className="text-[13px] leading-snug text-[rgba(29,29,31,0.58)] group-hover:text-[#1d1d1f]">
            {R.marketingOptIn}
          </span>
        </label>

        <button
          type="submit"
          disabled={pending}
          className={[
            "relative overflow-hidden rounded-xl px-4 py-3 text-sm font-semibold transition",
            pending
              ? "cursor-not-allowed border border-[rgba(0,113,227,0.12)] bg-[rgba(0,113,227,0.06)] text-[rgba(29,29,31,0.35)]"
              : "bg-gradient-to-r from-[#0071e3] to-[#32ade6] text-white shadow-[0_12px_28px_-14px_rgba(0,113,227,0.75)] hover:brightness-110",
          ].join(" ")}
        >
          {pending ? R.submitting : R.submit}
        </button>

        <div className="text-center text-sm text-[rgba(29,29,31,0.5)]">
          {R.hasAccount}{" "}
          {onRequestSignIn ? (
            <button
              type="button"
              onClick={onRequestSignIn}
              className="font-semibold text-[#0071e3] underline-offset-2 hover:underline"
            >
              {R.signIn}
            </button>
          ) : (
            <Link href={loginHref} className="font-semibold text-[#0071e3] hover:underline">
              {R.signIn}
            </Link>
          )}
        </div>
      </form>
    </div>
  );
}
