"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Heart, Pencil, Settings, Shield, LogOut, Bell } from "lucide-react";
import { signOut } from "@/app/auth/actions";
import { ExportDataButton } from "@/components/features/profile/export-data-button";
import { NotificationsPanel, type InAppNotification } from "@/components/features/profile/notifications-panel";
import { PalettePicker } from "@/components/features/profile/palette-picker";
import { LanguagePicker } from "@/components/features/profile/language-picker";
import { PushNotificationsSetup } from "@/components/pwa/push-notifications-setup";
import { PwaInstallHelp } from "@/components/pwa/pwa-install-help";
import { LeaveCoupleButton } from "@/components/features/pair/leave-couple-button";
import { AvatarUpload } from "@/components/features/profile/avatar-upload";
import { GenderSelect } from "@/components/features/profile/gender-select";
import { UserAvatar } from "@/components/ui/user-avatar";
import { updateProfile } from "@/lib/profile/actions";
import { useLanguage } from "@/components/providers/language-provider";
import type { MessageKey } from "@/lib/i18n/messages";
import type { ProfileGender } from "@/types/domain";

const GENDER_KEYS: Record<ProfileGender, MessageKey> = {
  female: "genderFemale",
  male: "genderMale",
  other: "genderOther",
};

type ProfileScreenProps = {
  userId: string;
  email: string;
  displayName: string;
  gender: ProfileGender | null;
  avatarUrl?: string | null;
  partnerAvatarUrl?: string | null;
  relationshipStartedOn: string | null;
  partnerName: string | null;
  partnerId: string | null;
  daysTogether: number | null;
  stats: { moods: number; plans: number; memories: number; answers: number } | null;
  isComplete: boolean;
  hasCouple: boolean;
  pushConfig: {
    serverReady: boolean;
    serviceRoleConfigured: boolean;
    vapidConfigured: boolean;
    vapidPublicKey: string | null;
    initialSubscriptionCount: number;
  };
  notifications: InAppNotification[];
};

type Tab = "settings" | "notifications" | "account";

export function ProfileScreen({
  userId,
  email,
  displayName,
  gender,
  avatarUrl,
  partnerAvatarUrl,
  relationshipStartedOn,
  partnerName,
  partnerId,
  daysTogether,
  stats,
  isComplete,
  hasCouple,
  pushConfig,
  notifications,
}: ProfileScreenProps) {
  const [tab, setTab] = useState<Tab>("notifications");
  const { t } = useLanguage();
  const [showEdit, setShowEdit] = useState(false);
  const resolvedName = displayName || t("defaultDisplayName");
  const [name, setName] = useState(displayName || resolvedName);
  const [profileGender, setProfileGender] = useState<ProfileGender | "">(gender ?? "");
  const [relationshipDate, setRelationshipDate] = useState(relationshipStartedOn ?? "");
  const [isPending, startTransition] = useTransition();

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData();
    formData.set("displayName", name);
    if (profileGender) {
      formData.set("gender", profileGender);
    }
    if (relationshipDate) {
      formData.set("relationshipStartedOn", relationshipDate);
    }

    startTransition(async () => {
      await updateProfile(formData);
      setShowEdit(false);
    });
  }

  const unreadCount = notifications.filter((item) => !item.read_at).length;

  const tabButtons: { id: Tab; label: string; shortLabel: string; icon: typeof Settings; badge?: boolean }[] = [
    { id: "settings", label: t("profileSettings"), shortLabel: t("profileSettingsShort"), icon: Settings },
    { id: "notifications", label: t("profileNotifications"), shortLabel: t("profileNotificationsShort"), icon: Bell, badge: unreadCount > 0 },
    { id: "account", label: t("profileAccount"), shortLabel: t("profileAccount"), icon: Shield },
  ];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <section className="flex items-center gap-4">
        <AvatarUpload imageUrl={avatarUrl} name={resolvedName} size="lg" userId={userId} />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{resolvedName}</h1>
          <p className="truncate text-sm text-[var(--muted)]">{email}</p>
          {gender ? (
            <p className="truncate text-sm text-[var(--muted)]">{t(GENDER_KEYS[gender])}</p>
          ) : null}
        </div>
        <button
          aria-label={t("profileEdit")}
          className="inline-flex items-center gap-1 rounded-2xl surface-input px-3 py-2 text-sm font-semibold"
          onClick={() => setShowEdit(true)}
          type="button"
        >
          <Pencil aria-hidden className="size-4" />
          {t("profileEdit")}
        </button>
      </section>

      {isComplete && partnerName && partnerId ? (
        <section className="mt-6 flex items-center justify-center gap-4">
          <UserAvatar imageUrl={avatarUrl} name={resolvedName} />
          <Heart aria-hidden className="size-6 fill-[var(--accent)] text-[var(--accent)]" />
          <UserAvatar href="/profile/partner" imageUrl={partnerAvatarUrl} name={partnerName} />
        </section>
      ) : null}

      {daysTogether !== null ? (
        <p className="mt-4 text-center text-sm text-[var(--muted)]">
          {t("profileTogetherDays", { days: daysTogether })}
        </p>
      ) : null}

      <div className="mt-8 flex rounded-full bg-[var(--input-bg)] p-1">
        {tabButtons.map(({ id, label, shortLabel, icon: Icon, badge }) => (
          <button
            aria-label={label}
            className={`relative flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 rounded-full px-2 py-2 text-sm font-semibold ${
              tab === id ? "bg-[var(--surface)] shadow-sm" : "text-[var(--muted)]"
            }`}
            key={id}
            onClick={() => setTab(id)}
            type="button"
          >
            <span className="relative inline-flex">
              <Icon aria-hidden className="size-5 shrink-0" />
              {badge ? (
                <span
                  aria-hidden
                  className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-[var(--accent)]"
                />
              ) : null}
            </span>
            <span className="hidden w-full truncate text-center text-[11px] min-[380px]:inline min-[380px]:text-xs">
              <span className="min-[430px]:hidden">{shortLabel}</span>
              <span className="hidden min-[430px]:inline">{label}</span>
            </span>
          </button>
        ))}
      </div>

      {tab === "settings" ? (
        <section className="mt-5 grid gap-4">
          <PalettePicker />
          <LanguagePicker />

          <PwaInstallHelp />

          {isComplete ? (
            <PushNotificationsSetup
              initialSubscriptionCount={pushConfig.initialSubscriptionCount}
              serverReady={pushConfig.serverReady}
              serviceRoleConfigured={pushConfig.serviceRoleConfigured}
              vapidConfigured={pushConfig.vapidConfigured}
              vapidPublicKey={pushConfig.vapidPublicKey}
            />
          ) : null}

          {stats ? (
            <div className="rounded-3xl surface-panel p-5">
              <p className="font-semibold">{t("profileStats")}</p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <p>{t("profileStatsMoods")}: {stats.moods}</p>
                <p>{t("profileStatsPlans")}: {stats.plans}</p>
                <p>{t("profileStatsMoments")}: {stats.memories}</p>
                <p>{t("profileStatsAnswers")}: {stats.answers}</p>
              </div>
            </div>
          ) : null}

          {!isComplete && hasCouple ? (
            <div className="rounded-3xl surface-panel border-dashed p-5">
              <p className="font-semibold">{t("profileWaitingPartner")}</p>
              <Link className="mt-3 inline-block text-[var(--accent)]" href="/pair">
                {t("profileManageInvite")}
              </Link>
            </div>
          ) : null}

          {!hasCouple ? (
            <div className="rounded-3xl surface-panel border-dashed p-5">
              <Link className="text-[var(--accent)]" href="/pair">
                {t("profileCreatePair")}
              </Link>
            </div>
          ) : null}
        </section>
      ) : tab === "notifications" ? (
        <div className="mt-5">
          <NotificationsPanel notifications={notifications} />
        </div>
      ) : (
        <section className="mt-5 grid gap-4">
          <ExportDataButton />

          {isComplete ? <LeaveCoupleButton variant="complete" /> : hasCouple ? <LeaveCoupleButton variant="solo" /> : null}

          <div className="rounded-3xl surface-panel p-5">
            <p className="font-semibold">{t("profileDeleteAccount")}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{t("profileDeleteHint")}</p>
          </div>

          <form action={signOut}>
            <button
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl surface-panel px-5 py-4 font-semibold"
              type="submit"
            >
              <LogOut aria-hidden className="size-5" />
              {t("profileSignOut")}
            </button>
          </form>
        </section>
      )}

      {showEdit ? (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40 p-4 pb-[calc(max(0.75rem,env(safe-area-inset-bottom))+5rem)]">
          <form
            className="w-full max-w-md rounded-3xl surface-panel p-5 shadow-xl"
            onSubmit={handleSaveProfile}
          >
            <p className="text-lg font-bold">{t("profileEditTitle")}</p>
            <div className="mt-4 grid gap-3">
              <label className="grid gap-2">
                <span className="text-sm font-semibold">{t("profileName")}</span>
                <input
                  className="rounded-2xl surface-input px-4 py-3"
                  onChange={(event) => setName(event.target.value)}
                  required
                  value={name}
                />
              </label>
              <div className="grid gap-2">
                <span className="text-sm font-semibold">{t("profileGender")}</span>
                <GenderSelect
                  disabled={isPending}
                  onChange={setProfileGender}
                  value={profileGender}
                />
              </div>
              {relationshipStartedOn !== null ? (
                <input
                  className="rounded-2xl surface-input px-4 py-3"
                  onChange={(event) => setRelationshipDate(event.target.value)}
                  type="date"
                  value={relationshipDate}
                />
              ) : null}
              <button
                className="rounded-2xl bg-[var(--accent)] px-4 py-3 font-semibold text-white disabled:opacity-60"
                disabled={isPending}
                type="submit"
              >
                {isPending ? t("profileSaving") : t("profileSave")}
              </button>
              <button
                className="rounded-2xl surface-input px-4 py-3 font-semibold"
                onClick={() => setShowEdit(false)}
                type="button"
              >
                {t("profileCancel")}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </main>
  );
}
