"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZodError } from "zod";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/config/app-url";
import {
  resetPasswordRequestSchema,
  signInSchema,
  signUpSchema,
  type ResetPasswordRequestInput,
  type SignInInput,
  type SignUpInput,
} from "@/lib/validation/auth";

type AuthMode = "signup" | "signin" | "reset";

type AuthFormProps = {
  initialError?: string | null;
  initialMode?: AuthMode;
  nextPath?: string;
};

function mapAuthError(message: string, t: (key: MessageKey) => string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return t("authErrorInvalid");
  }

  if (normalized.includes("user already registered")) {
    return t("authErrorExists");
  }

  if (normalized.includes("email not confirmed")) {
    return t("authErrorUnconfirmed");
  }

  if (normalized.includes("password")) {
    return t("authErrorPassword");
  }

  if (normalized.includes("rate limit")) {
    return t("authErrorRateLimit");
  }

  return t("commonErrorGeneric");
}

export function AuthForm({
  initialError,
  initialMode = "signin",
  nextPath = "/dashboard",
}: AuthFormProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState(initialError ?? "");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setFieldErrors({});
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === "reset") {
        const parsed: ResetPasswordRequestInput = resetPasswordRequestSchema.parse({
          email,
        });

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(
          parsed.email,
          {
            redirectTo: `${getAppUrl()}/auth/callback?next=/auth/update-password`,
          },
        );

        if (resetError) {
          setError(mapAuthError(resetError.message, t));
          return;
        }

        setSuccess(t("authResetSent"));
        return;
      }

      if (mode === "signup") {
        const parsed: SignUpInput = signUpSchema.parse({
          displayName,
          email,
          password,
        });

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: parsed.email,
          password: parsed.password,
          options: {
            data: { display_name: parsed.displayName },
            emailRedirectTo: `${getAppUrl()}/auth/callback?next=${encodeURIComponent(nextPath)}`,
          },
        });

        if (signUpError) {
          setError(mapAuthError(signUpError.message, t));
          return;
        }

        if (data.session) {
          router.refresh();
          router.push(nextPath);
          return;
        }

        setSuccess(t("authAccountCreated"));
        return;
      }

      const parsed: SignInInput = signInSchema.parse({ email, password });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message, t));
        return;
      }

      router.refresh();
      router.push(nextPath);
    } catch (caught) {
      if (caught instanceof ZodError) {
        const nextErrors: Record<string, string> = {};
        for (const issue of caught.issues) {
          const key = issue.path[0]?.toString() ?? "form";
          if (!nextErrors[key]) {
            nextErrors[key] = issue.message;
          }
        }
        setFieldErrors(nextErrors);
        return;
      }

      setError(t("commonErrorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  function switchMode(nextMode: AuthMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
    setFieldErrors({});
  }

  if (mode === "reset") {
    return (
      <div>
        <h2 className="text-xl font-bold">{t("authResetTitle")}</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("authResetHint")}</p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium">{t("authEmail")}</span>
            <input
              autoComplete="email"
              className="rounded-2xl surface-input px-4 py-3"
              disabled={loading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
            {fieldErrors.email ? (
              <span className="text-sm text-[var(--danger-text)]">{fieldErrors.email}</span>
            ) : null}
          </label>

          {error ? (
            <p className="alert-error rounded-2xl px-4 py-3 text-sm">{error}</p>
          ) : null}

          {success ? (
            <p className="rounded-2xl alert-success rounded-2xl px-4 py-3 text-sm">{success}</p>
          ) : null}

          <button
            className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? t("authResetSending") : t("authResetSubmit")}
          </button>

          <button
            className="text-sm font-medium text-[var(--accent)]"
            onClick={() => switchMode("signin")}
            type="button"
          >
            {t("authBackToSignIn")}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl surface-panel p-1">
        <button
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            mode === "signup"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)]"
          }`}
          onClick={() => switchMode("signup")}
          type="button"
        >
          {t("authSignUp")}
        </button>
        <button
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            mode === "signin"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)]"
          }`}
          onClick={() => switchMode("signin")}
          type="button"
        >
          {t("authSignIn")}
        </button>
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">{t("authSessionHint")}</p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium">{t("authDisplayName")}</span>
            <input
              autoComplete="name"
              className="rounded-2xl surface-input px-4 py-3"
              disabled={loading}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={t("authDisplayNamePlaceholder")}
              value={displayName}
            />
            {fieldErrors.displayName ? (
              <span className="text-sm text-[var(--danger-text)]">{fieldErrors.displayName}</span>
            ) : null}
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t("authEmail")}</span>
          <input
            autoComplete="email"
            className="rounded-2xl surface-input px-4 py-3"
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
          {fieldErrors.email ? (
            <span className="text-sm text-[var(--danger-text)]">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">{t("authPassword")}</span>
          <input
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="rounded-2xl surface-input px-4 py-3"
            disabled={loading}
            minLength={mode === "signup" ? 8 : undefined}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              mode === "signup" ? t("authPasswordNewPlaceholder") : t("authPasswordPlaceholder")
            }
            type="password"
            value={password}
          />
          {fieldErrors.password ? (
            <span className="text-sm text-[var(--danger-text)]">{fieldErrors.password}</span>
          ) : null}
        </label>

        {mode === "signin" ? (
          <button
            className="justify-self-start text-sm font-medium text-[var(--accent)]"
            onClick={() => switchMode("reset")}
            type="button"
          >
            {t("authForgotPassword")}
          </button>
        ) : null}

        {error ? <p className="alert-error rounded-2xl px-4 py-3 text-sm">{error}</p> : null}

        {success ? (
          <p className="rounded-2xl alert-success rounded-2xl px-4 py-3 text-sm">{success}</p>
        ) : null}

        <button
          className="mt-2 rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading
            ? t("authPleaseWait")
            : mode === "signup"
              ? t("authSubmitSignUp")
              : t("authSubmitSignIn")}
        </button>
      </form>
    </div>
  );
}
