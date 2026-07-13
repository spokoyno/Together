import { InviteLinkDisplay } from "@/components/features/pair/invite-link-display";
import { formatDateRu } from "@/lib/dates";

type PairWaitingPanelProps = {
  inviteUrl: string | null;
  relationshipStartedOn: string | null;
};

export function PairWaitingPanel({ inviteUrl, relationshipStartedOn }: PairWaitingPanelProps) {
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

      {inviteUrl ? (
        <InviteLinkDisplay inviteUrl={inviteUrl} />
      ) : (
        <p className="alert-error rounded-2xl px-4 py-3 text-sm">
          Не удалось получить ссылку. Обновите страницу или зайдите позже.
        </p>
      )}
    </div>
  );
}
