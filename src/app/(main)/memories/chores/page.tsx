import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { ChoresPanel } from "@/components/features/hub/chores-panel";
import { loadHubChores, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubChoresPage() {
  const ctx = await requireHubContext();
  const chores = await loadHubChores(ctx);

  const { data: profiles } = await ctx.supabase
    .from("profiles")
    .select("id, display_name")
    .in("id", [ctx.userId, ctx.partnerId]);

  const members =
    profiles?.map((profile) => ({
      id: profile.id,
      name: profile.display_name,
    })) ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Общие домашние задачи" title="Дела" />
      <ChoresPanel chores={chores} members={members} />
    </main>
  );
}
