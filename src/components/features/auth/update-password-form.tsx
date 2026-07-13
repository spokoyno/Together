"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ZodError } from "zod";
import { useLanguage } from "@/components/providers/language-provider";
import { createClient } from "@/lib/supabase/client";
import { updatePasswordSchema } from "@/lib/validation/auth";

export function UpdatePasswordForm() {
  const router = useRouter();
  const { t } = useLanguage();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setFieldErrors({});
    setLoading(true);

    try {
      const parsed = updatePasswordSchema.parse({ password, confirmPassword });
      const supabase = createClient();

      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.password,
      });

      if (updateError) {
        setError(t("authPasswordUpdateError"));
        return;
      }

      router.refresh();
      router.push("/dashboard");
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

      setError(t("authPasswordUpdateErrorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-8 grid gap-4" onSubmit={handleSubmit}>
      <label className="grid gap-2">
        <span className="text-sm font-medium">{t("authNewPassword")}</span>
        <input
          autoComplete="new-password"
          className="rounded-2xl surface-input px-4 py-3"
          disabled={loading}
          minLength={8}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          value={password}
        />
        {fieldErrors.password ? (
          <span className="text-sm text-[var(--danger-text)]">{fieldErrors.password}</span>
        ) : null}
      </label>

      <label className="grid gap-2">
        <span className="text-sm font-medium">{t("authRepeatPassword")}</span>
        <input
          autoComplete="new-password"
          className="rounded-2xl surface-input px-4 py-3"
          disabled={loading}
          minLength={8}
          onChange={(event) => setConfirmPassword(event.target.value)}
          type="password"
          value={confirmPassword}
        />
        {fieldErrors.confirmPassword ? (
          <span className="text-sm text-[var(--danger-text)]">{fieldErrors.confirmPassword}</span>
        ) : null}
      </label>

      {error ? (
        <p className="alert-error rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}

      <button
        className="rounded-2xl bg-[var(--accent)] px-5 py-4 font-semibold text-white disabled:opacity-60"
        disabled={loading}
        type="submit"
      >
        {loading ? t("profileSaving") : t("authSavePassword")}
      </button>
    </form>
  );
}
