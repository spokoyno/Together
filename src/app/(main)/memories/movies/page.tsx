import { HubPanelHeader } from "@/components/features/hub/hub-panel-header";
import { MoviesPanel } from "@/components/features/hub/movies-panel";
import { loadHubMovies, loadMovieCollections, requireHubContext } from "@/lib/hub/load-data.server";

export default async function HubMoviesPage() {
  const ctx = await requireHubContext();
  const [movies, collections] = await Promise.all([
    loadHubMovies(ctx),
    loadMovieCollections(ctx),
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-md px-5 pb-32 pt-8">
      <HubPanelHeader subtitleKey="panelMoviesDesc" titleKey="panelMovies" />
      <MoviesPanel
        collections={collections}
        movies={movies}
        partnerId={ctx.partnerId}
        partnerName={ctx.partnerName}
        userId={ctx.userId}
      />
    </main>
  );
}
