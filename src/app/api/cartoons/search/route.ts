import { NextResponse } from "next/server";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-json";

type TmdbTv = {
  id: number;
  name: string;
  first_air_date?: string;
  poster_path?: string | null;
  genre_ids?: number[];
};

const ANIMATION_GENRE_ID = 16;

export async function GET(request: Request) {
  const apiKey = process.env.TMDB_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (!apiKey) {
    return NextResponse.json({
      results: [],
      error: "TMDB_API_KEY не настроен",
    });
  }

  const url = new URL("https://api.themoviedb.org/3/search/tv");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "ru-RU");
  url.searchParams.set("include_adult", "false");

  const response = await fetchJsonWithTimeout<{ results?: TmdbTv[] }>(url.toString(), {
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json({ results: [], error: "Ошибка поиска мультсериалов" }, { status: 502 });
  }

  const payload = response.data;

  const results =
    payload.results
      ?.filter((show) => show.genre_ids?.includes(ANIMATION_GENRE_ID))
      .slice(0, 12)
      .map((show) => ({
        id: show.id,
        title: show.name,
        posterUrl: show.poster_path ? `https://image.tmdb.org/t/p/w342${show.poster_path}` : null,
        year: show.first_air_date?.slice(0, 4) ?? null,
      })) ?? [];

  return NextResponse.json({ results });
}
