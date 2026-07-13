import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { CyclePanel } from "@/components/features/hub/cycle-panel";
import { loadMenstrualCycle, requireHubContext } from "@/lib/hub/load-data.server";
import type { ProfileGender } from "@/types/domain";

export default async function HubCyclePage() {
  const ctx = await requireHubContext();
  const [cycle, profile] = await Promise.all([
    loadMenstrualCycle(ctx),
    ctx.supabase.from("profiles").select("gender").eq("id", ctx.userId).maybeSingle(),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Календарь цикла" title="Месячные" />
      <CyclePanel
        cycle={cycle}
        partnerName={ctx.partnerName}
        userGender={(profile.data?.gender as ProfileGender | null) ?? null}
      />
    </main>
  );
}
