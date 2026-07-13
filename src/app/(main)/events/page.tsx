import { redirect } from "next/navigation";
import { EventsPageContent } from "@/components/features/events/events-page-content";
import { requireUser } from "@/lib/auth/session";
import { getCoupleContextForUser } from "@/lib/couple/context.server";

export default async function EventsPage() {
  const { supabase, user } = await requireUser();
  const context = await getCoupleContextForUser(user.id);

  if (!context?.isComplete) {
    redirect("/dashboard");
  }

  const { data: events } = await supabase
    .from("events")
    .select("id, title, starts_at")
    .eq("couple_id", context.coupleId)
    .order("starts_at", { ascending: true });

  const now = new Date();
  const upcoming = events?.filter((event) => new Date(event.starts_at) >= now) ?? [];
  const past = events?.filter((event) => new Date(event.starts_at) < now) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-28 pt-8">
      <EventsPageContent past={past} upcoming={upcoming} />
    </main>
  );
}
