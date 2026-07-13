"use client";

import { Gift, Heart, Plus, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { HubComplimentState } from "@/components/features/hub/types";
import { addCompliment, drawCompliment } from "@/lib/hub/actions";

type ComplimentsPanelProps = {
  partnerName: string;
  state: HubComplimentState;
};

const JAR_CAPACITY = 12;

function jarFillPercent(count: number) {
  return Math.min(100, Math.round((count / JAR_CAPACITY) * 100));
}

type ComplimentJarProps = {
  count: number;
  disabled?: boolean;
  onTap: () => void;
};

function ComplimentJar({ count, disabled, onTap }: ComplimentJarProps) {
  const fill = jarFillPercent(count);

  return (
    <button
      aria-label="Достать комплимент из банки"
      className="group relative mx-auto block w-52 transition-transform active:scale-[0.98] disabled:opacity-70 sm:w-56"
      disabled={disabled}
      onClick={onTap}
      type="button"
    >
      <div className="absolute -top-3 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full border-2 border-[var(--border)] bg-[var(--surface)] shadow-sm" />
      <div className="absolute -top-1 left-1/2 z-10 h-2 w-16 -translate-x-1/2 rounded-full bg-[var(--input-bg)]" />

      <div className="relative overflow-hidden rounded-b-[3.5rem] rounded-t-[1.75rem] border-[3px] border-[var(--border)] bg-[var(--input-bg)] shadow-lg">
        <div className="relative h-64 sm:h-72">
          <div
            className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[var(--accent)] via-[var(--accent-soft)] to-pink-200/40 transition-all duration-700 ease-out dark:to-pink-900/30"
            style={{ height: `${Math.max(fill, count > 0 ? 14 : 0)}%` }}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-8">
            {count > 0 ? (
              <div className="mb-3 flex gap-1">
                {Array.from({ length: Math.min(count, 5) }).map((_, index) => (
                  <Heart
                    aria-hidden
                    className="size-5 text-white/90 drop-shadow"
                    fill="currentColor"
                    key={index}
                  />
                ))}
              </div>
            ) : (
              <Sparkles aria-hidden className="mb-4 size-8 text-[var(--muted)]" />
            )}
            <p className="text-sm font-semibold text-[var(--foreground)]">
              {count > 0 ? `${count} внутри` : "Пусто"}
            </p>
          </div>
        </div>
      </div>

      <p className="mt-4 text-center text-sm font-medium text-[var(--muted)] transition-colors group-enabled:group-hover:text-[var(--accent)]">
        Нажмите на банку
      </p>
    </button>
  );
}

export function ComplimentsPanel({ partnerName, state }: ComplimentsPanelProps) {
  const router = useRouter();
  const [showAddPopup, setShowAddPopup] = useState(false);
  const [showDrawnPopup, setShowDrawnPopup] = useState(false);
  const [draft, setDraft] = useState("");
  const [drawnText, setDrawnText] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function pullCompliment() {
    if (!state.canDraw && state.myJarCount === 0) {
      setError("Банка пуста — попросите партнёра добавить комплимент.");
      return;
    }

    if (!state.canDraw && state.waitMinutes > 0) {
      setError(`Можно доставать комплимент раз в час. Подождите ${state.waitMinutes} мин.`);
      return;
    }

    setError("");
    startTransition(async () => {
      const result = await drawCompliment();
      if (!result.ok) {
        setError(result.error ?? "Не удалось достать комплимент.");
        return;
      }
      setDrawnText(result.text);
      setShowDrawnPopup(true);
      router.refresh();
    });
  }

  function submitCompliment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    startTransition(async () => {
      const result = await addCompliment(draft);
      if (!result.ok) {
        setError(result.error ?? "Не удалось добавить комплимент.");
        return;
      }
      setDraft("");
      setShowAddPopup(false);
      router.refresh();
    });
  }

  return (
    <>
      <section className="flex min-h-[calc(100dvh-14rem)] flex-col items-center justify-center pb-8">
        <p className="mb-8 max-w-xs text-center text-sm leading-6 text-[var(--muted)]">
          Ваша банка с комплиментами от {partnerName}. Доставать — раз в час.
        </p>

        <div className="relative">
          <ComplimentJar
            count={state.myJarCount}
            disabled={isPending}
            onTap={pullCompliment}
          />

          <button
            aria-label={`Добавить комплимент для ${partnerName}`}
            className="absolute -right-3 top-10 grid size-14 place-items-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform active:scale-95 disabled:opacity-60"
            disabled={isPending}
            onClick={() => {
              setError("");
              setShowAddPopup(true);
            }}
            type="button"
          >
            <Plus aria-hidden className="size-7" strokeWidth={2.4} />
          </button>
        </div>

        {state.waitMinutes > 0 ? (
          <p className="mt-6 text-sm text-[var(--muted)]">
            Следующий комплимент через {state.waitMinutes} мин
          </p>
        ) : null}

        {error && !showAddPopup && !showDrawnPopup ? (
          <p className="mt-4 max-w-xs rounded-2xl alert-error px-4 py-3 text-center text-sm">
            {error}
          </p>
        ) : null}
      </section>

      {showAddPopup ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={submitCompliment}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-bold">Комплимент для {partnerName}</p>
                <p className="mt-1 text-sm text-[var(--muted)]">
                  Партнёр сможет достать его из своей банки
                </p>
              </div>
              <button
                aria-label="Закрыть"
                className="grid size-11 place-items-center rounded-full surface-input"
                onClick={() => {
                  setShowAddPopup(false);
                  setDraft("");
                  setError("");
                }}
                type="button"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>

            <textarea
              autoFocus
              className="min-h-28 w-full rounded-2xl surface-input px-4 py-3"
              maxLength={280}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Напишите что-нибудь приятное..."
              value={draft}
            />

            {error ? <p className="mt-3 alert-error rounded-xl px-3 py-2 text-sm">{error}</p> : null}

            <button
              className="mt-4 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
              disabled={isPending || !draft.trim()}
              type="submit"
            >
              {isPending ? "Отправляем..." : "Положить в банку"}
            </button>
          </form>
        </div>
      ) : null}

      {showDrawnPopup && drawnText ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-6">
          <div className="w-full max-w-sm rounded-3xl surface-panel p-6 text-center shadow-2xl">
            <Gift aria-hidden className="mx-auto size-10 text-[var(--accent)]" />
            <p className="mt-3 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
              Для вас
            </p>
            <p className="mt-4 text-xl font-semibold leading-8">{drawnText}</p>
            <button
              className="mt-6 w-full rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white"
              onClick={() => {
                setShowDrawnPopup(false);
                setDrawnText(null);
              }}
              type="button"
            >
              Спасибо ♥
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
