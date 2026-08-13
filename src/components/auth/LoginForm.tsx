"use client";

import Link from "next/link";
import { Suspense, useActionState, useId, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";

import { authErrorMessage } from "@/components/auth/authErrors";
import { authInputClass } from "@/components/auth/authFormStyles";
import { FieldError } from "@/components/auth/FieldError";
import { PasswordInput } from "@/components/auth/PasswordInput";
import { useI18n } from "@/contexts/i18n-context";
import { useMessages } from "@/contexts/messages-context";
import { withLocale } from "@/i18n/config";
import { loginAction, type AuthActionState } from "@/lib/actions/auth";
import {
  type LoginField,
  hasFieldErrors,
  validateLoginFields,
} from "@/lib/auth/validation";

type Props = {
  onRequestRegister?: () => void;
  compact?: boolean;
  /** Flat form for AuthModal — no card chrome / duplicate titles. */
  embedded?: boolean;
  next?: string | null;
};

function LoginFormInner({ onRequestRegister, compact, embedded, next: nextProp }: Props) {
  const { auth } = useMessages();
  const { locale } = useI18n();
  const L = auth.login;
  const V = auth.validation;
  const uid = useId();
  const searchParams = useSearchParams();
  const next = nextProp ?? searchParams.get("next");
  const registerHref = (() => {
    const path = withLocale(locale, "/register");
    return next ? `${path}?next=${encodeURIComponent(next)}` : path;
  })();

  const [state, formAction, pending] = useActionState<AuthActionState, FormData>(
    loginAction,
    null,
  );
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState<Partial<Record<LoginField, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const lastSubmit = useRef({ identifier: "", password: "" });

  const clientErrors = useMemo(
    () => validateLoginFields(identifier, password),
    [identifier, password],
  );
  const unchangedSinceSubmit =
    identifier === lastSubmit.current.identifier &&
    password === lastSubmit.current.password;

  const showError = (field: LoginField) => {
    if (!(touched[field] || submitted)) return undefined;
    const serverCode = unchangedSinceSubmit ? state?.fieldErrors?.[field] : undefined;
    return authErrorMessage(V, clientErrors[field] ?? serverCode);
  };

  const identifierError = showError("email");
  const passwordError = showError("password");
  const bannerCode =
    unchangedSinceSubmit &&
    (state?.error === "invalidCredentials" || state?.error === "ambiguousLogin")
      ? state.error
      : undefined;
  const banner = authErrorMessage(V, bannerCode);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    setSubmitted(true);
    lastSubmit.current = { identifier, password };
    if (hasFieldErrors(clientErrors)) event.preventDefault();
  };

  const form = (
    <form
      className={embedded ? "grid gap-3" : "mt-5 grid gap-4"}
      action={formAction}
      noValidate
      onSubmit={onSubmit}
    >
      {next ? <input type="hidden" name="next" value={next} /> : null}

      <label className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(29,29,31,0.48)]">
          {L.emailLabel}
        </span>
        <input
          id={`${uid}-email`}
          name="email"
          type="text"
          autoComplete="username"
          className={authInputClass(Boolean(identifierError))}
          placeholder="you@company.com or alex_morgan"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, email: true }))}
          aria-invalid={Boolean(identifierError)}
          aria-describedby={identifierError ? `${uid}-email-error` : undefined}
        />
        <FieldError id={`${uid}-email-error`} message={identifierError} />
      </label>

      <label className="grid gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[rgba(29,29,31,0.48)]">
          {L.passwordLabel}
        </span>
        <PasswordInput
          id={`${uid}-password`}
          name="password"
          autoComplete="current-password"
          className={authInputClass(Boolean(passwordError))}
          showLabel={auth.showPassword}
          hideLabel={auth.hidePassword}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={() => setTouched((t) => ({ ...t, password: true }))}
          aria-invalid={Boolean(passwordError)}
          aria-describedby={passwordError ? `${uid}-password-error` : undefined}
        />
        <FieldError id={`${uid}-password-error`} message={passwordError} />
      </label>

      {banner ? (
        <p
          className="rounded-xl border border-red-500/25 bg-red-50 px-3.5 py-2.5 text-sm text-red-700"
          role="alert"
        >
          {banner}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className={[
          "mt-1 inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition",
          pending
            ? "cursor-not-allowed border border-[rgba(0,113,227,0.12)] bg-[rgba(0,113,227,0.06)] text-[rgba(29,29,31,0.35)]"
            : "bg-gradient-to-r from-[#0071e3] to-[#32ade6] text-white shadow-[0_12px_28px_-14px_rgba(0,113,227,0.75)] hover:brightness-110",
        ].join(" ")}
      >
        {pending ? L.submitting : L.submit}
      </button>
    </form>
  );

  const footer = (
    <p className={embedded ? "mt-4 text-center text-sm text-[rgba(29,29,31,0.5)]" : "mt-4 text-center text-sm text-[var(--muted)]"}>
      {L.noAccount}{" "}
      {onRequestRegister ? (
        <button
          type="button"
          className="font-semibold text-[#0071e3] underline-offset-2 hover:underline"
          onClick={onRequestRegister}
        >
          {L.createOne}
        </button>
      ) : (
        <Link
          href={registerHref}
          className="font-semibold text-[#0071e3] underline-offset-2 hover:underline"
        >
          {L.createOne}
        </Link>
      )}
    </p>
  );

  if (embedded) {
    return (
      <div>
        {form}
        {footer}
      </div>
    );
  }

  const pad = compact ? "p-4" : "p-6";
  const shell = compact
    ? "rounded-3xl border border-[rgba(0,113,227,0.14)] bg-white shadow-[0_24px_90px_-40px_rgba(8,16,46,0.28)]"
    : "rounded-3xl border border-[rgba(0,113,227,0.12)] bg-white/92 shadow-[0_24px_80px_-48px_rgba(8,16,46,0.28)] backdrop-blur-2xl";

  return (
    <div className={`${shell} ${pad}`}>
      <p className="text-[13px] font-medium leading-relaxed text-[var(--muted)] sm:text-sm">
        {L.welcome}
      </p>
      <div className="mt-3 text-xl font-semibold text-[var(--fg)]">{L.title}</div>
      <div className="mt-1 text-sm text-[var(--muted)]">{L.subtitle}</div>
      {form}
      {footer}
    </div>
  );
}

export function LoginForm(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="rounded-3xl border border-[rgba(0,113,227,0.12)] bg-white/90 p-6 text-sm text-[var(--muted)]">
          …
        </div>
      }
    >
      <LoginFormInner {...props} />
    </Suspense>
  );
}
