import Link from "next/link";
import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";
import { InviteRegenerateButton } from "@/components/features/pair/invite-regenerate-button";
import { LeaveCoupleButton } from "@/components/features/pair/leave-couple-button";
import { formatDateRu } from "@/lib/dates";

type PairWaitingPanelProps = {
  inviteUrl: string | null;
  relationshipStartedOn: string | null;
  showDashboardLink?: boolean;
  showProfileLink?: boolean;
};

export function PairWaitingPanel({
  inviteUrl,
  relationshipStartedOn,
  showDashboardLink = true,
  showProfileLink = false,
}: PairWaitingPanelProps) {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold text-[var(--accent)]">Ожидание партнёра</p>
        <h1 className="mt-2 text-3xl font-bold">Подключите партнёра</h1>
        <p className="mt-3 leading-7 text-[var(--muted)]">
          Отправьте ссылку партнёру. Ссылка действует 7 дней. После подключения откроется полный
          доступ к приложению.
        </p>
      </div>

      {relationshipStartedOn ? (
        <p className="rounded-2xl surface-input px-4 py-3 text-sm">
          Вместе с {formatDateRu(relationshipStartedOn)}
        </p>
      ) : null}

      <div className="grid gap-3">
        {inviteUrl ? (
          <>
            <InviteLinkDisplay inviteUrl={inviteUrl} />
            <InviteRegenerateButton />
          </>
        ) : (
          <InviteRegenerateButton label="Получить ссылку-приглашение" />
        )}
      </div>

      <div className="grid gap-3">
        {showDashboardLink ? (
          <Link
            className="block rounded-2xl bg-[var(--accent-soft)] px-5 py-4 text-center font-semibold text-[var(--accent)]"
            href="/dashboard"
          >
            Перейти на главную
          </Link>
        ) : null}

        {showProfileLink ? (
          <Link
            className="block rounded-2xl surface-panel px-5 py-4 text-center font-semibold"
            href="/profile"
          >
            Профиль и настройки
          </Link>
        ) : null}

        <LeaveCoupleButton variant="solo" />
      </div>
    </div>
  );
}
