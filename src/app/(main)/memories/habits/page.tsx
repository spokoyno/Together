import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { HabitsPanel } from "@/components/features/hub/habits-panel";
import { loadHubHabits, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubHabitsPage() {
  const ctx = await requireHubContext();
  const habits = await loadHubHabits(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Привычки для двоих" title="Привычки" />
      <HabitsPanel habits={habits} />
    </main>
  );
}
