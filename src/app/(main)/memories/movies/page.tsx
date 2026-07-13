import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { MoviesPanel } from "@/components/features/hub/movies-panel";
import { loadHubMovies, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubMoviesPage() {
  const ctx = await requireHubContext();
  const movies = await loadHubMovies(ctx);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitle="Поиск и оценки вдвоём" title="Фильмы" />
      <MoviesPanel
        movies={movies}
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
