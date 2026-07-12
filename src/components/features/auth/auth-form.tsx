"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZodError } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getAppUrl } from "@/lib/auth/routes";
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

function mapAuthError(message: string): string {
  const normalized = message.toLowerCase();

  if (normalized.includes("invalid login credentials")) {
    return "Неверный email или пароль.";
  }

  if (normalized.includes("user already registered")) {
    return "Пользователь с таким email уже зарегистрирован.";
  }

  if (normalized.includes("email not confirmed")) {
    return "Подтвердите email — проверьте почту.";
  }

  if (normalized.includes("password")) {
    return "Пароль не подходит. Нужно минимум 8 символов.";
  }

  if (normalized.includes("rate limit")) {
    return "Слишком много попыток. Подождите немного.";
  }

  return "Не удалось выполнить действие. Попробуйте ещё раз.";
}

export function AuthForm({
  initialError,
  initialMode = "signin",
  nextPath = "/dashboard",
}: AuthFormProps) {
  const router = useRouter();
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
          setError(mapAuthError(resetError.message));
          return;
        }

        setSuccess("Ссылка для сброса пароля отправлена на ваш email.");
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
          setError(mapAuthError(signUpError.message));
          return;
        }

        if (data.session) {
          router.refresh();
          router.push(nextPath);
          return;
        }

        setSuccess(
          "Аккаунт создан. Проверьте почту и перейдите по ссылке для подтверждения.",
        );
        return;
      }

      const parsed: SignInInput = signInSchema.parse({ email, password });

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: parsed.email,
        password: parsed.password,
      });

      if (signInError) {
        setError(mapAuthError(signInError.message));
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

      setError("Не удалось выполнить действие. Попробуйте ещё раз.");
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
        <h2 className="text-xl font-bold">Восстановление доступа</h2>
        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
          Мы отправим ссылку для нового пароля на ваш email.
        </p>

        <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
          <label className="grid gap-2">
            <span className="text-sm font-medium">Email</span>
            <input
              autoComplete="email"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              disabled={loading}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
              type="email"
              value={email}
            />
            {fieldErrors.email ? (
              <span className="text-sm text-red-600">{fieldErrors.email}</span>
            ) : null}
          </label>

          {error ? (
            <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {success}
            </p>
          ) : null}

          <button
            className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Отправляем..." : "Отправить ссылку"}
          </button>

          <button
            className="text-sm font-medium text-[var(--accent)]"
            onClick={() => switchMode("signin")}
            type="button"
          >
            ← Вернуться ко входу
          </button>
        </form>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[var(--border)] bg-white p-1">
        <button
          className={`rounded-xl px-4 py-3 text-sm font-semibold ${
            mode === "signup"
              ? "bg-[var(--accent)] text-white"
              : "text-[var(--muted)]"
          }`}
          onClick={() => switchMode("signup")}
          type="button"
        >
          Регистрация
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
          Вход
        </button>
      </div>

      <p className="mt-4 text-xs leading-5 text-[var(--muted)]">
        На этом устройстве вы останетесь в системе — повторный вход не потребуется,
        пока действует сессия.
      </p>

      <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
        {mode === "signup" ? (
          <label className="grid gap-2">
            <span className="text-sm font-medium">Имя</span>
            <input
              autoComplete="name"
              className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
              disabled={loading}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="Ваше имя"
              value={displayName}
            />
            {fieldErrors.displayName ? (
              <span className="text-sm text-red-600">{fieldErrors.displayName}</span>
            ) : null}
          </label>
        ) : null}

        <label className="grid gap-2">
          <span className="text-sm font-medium">Email</span>
          <input
            autoComplete="email"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            type="email"
            value={email}
          />
          {fieldErrors.email ? (
            <span className="text-sm text-red-600">{fieldErrors.email}</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium">Пароль</span>
          <input
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
            disabled={loading}
            minLength={mode === "signup" ? 8 : undefined}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={mode === "signup" ? "Минимум 8 символов" : "Ваш пароль"}
            type="password"
            value={password}
          />
          {fieldErrors.password ? (
            <span className="text-sm text-red-600">{fieldErrors.password}</span>
          ) : null}
        </label>

        {mode === "signin" ? (
          <button
            className="justify-self-start text-sm font-medium text-[var(--accent)]"
            onClick={() => switchMode("reset")}
            type="button"
          >
            Забыли пароль?
          </button>
        ) : null}

        {error ? (
          <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {success ? (
          <p className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
            {success}
          </p>
        ) : null}

        <button
          className="mt-2 rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading
            ? "Подождите..."
            : mode === "signup"
              ? "Создать аккаунт"
              : "Войти"}
        </button>
      </form>
    </div>
  );
}
