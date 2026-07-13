import { redirect } from "next/navigation";
import { MemoriesFeed } from "@/components/features/memories/memories-feed";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";
import { signMediaPaths } from "@/lib/media/actions";
import type { MomentMeta, MomentType } from "@/types/domain";

export default async function MemoriesPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete || !context.partner) {
    redirect("/dashboard");
  }

  const { data: rows } = await supabase
    .from("memories")
    .select(
      "id, title, body, happened_on, media_path, moment_type, meta, created_at, profiles(display_name)",
    )
    .eq("couple_id", context.coupleId)
    .order("happened_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  const mediaPaths =
    rows?.map((row) => row.media_path).filter((path): path is string => Boolean(path)) ?? [];
  const signedUrls = await signMediaPaths(supabase, mediaPaths);

  const memories =
    rows?.map((row) => {
      const profile = row.profiles as { display_name: string } | { display_name: string }[] | null;
      const author = Array.isArray(profile) ? profile[0] : profile;

      return {
        id: row.id,
        title: row.title,
        body: row.body,
        happened_on: row.happened_on,
        media_url: row.media_path ? signedUrls[row.media_path] ?? null : null,
        moment_type: row.moment_type as MomentType,
        meta: (row.meta ?? {}) as MomentMeta,
        created_at: row.created_at,
        author_name: author?.display_name ?? "Пользователь",
      };
    }) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <h1 className="text-2xl font-bold">Моменты</h1>
      <p className="mt-1 text-sm text-[var(--muted)]">Лента ваших воспоминаний вместе</p>
      <MemoriesFeed
        coupleId={context.coupleId}
        memories={memories}
        partnerId={context.partner.id}
        partnerName={context.partner.display_name}
        userId={user.id}
      />
    </main>
  );
}
