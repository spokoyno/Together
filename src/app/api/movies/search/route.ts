import { NextResponse } from "next/server";

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path?: string | null;
};

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

  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("query", query);
  url.searchParams.set("language", "ru-RU");
  url.searchParams.set("include_adult", "false");

  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    return NextResponse.json({ results: [], error: "Ошибка поиска фильмов" }, { status: 502 });
  }

  const payload = (await response.json()) as { results?: TmdbMovie[] };

  const results =
    payload.results?.slice(0, 12).map((movie) => ({
      id: movie.id,
      title: movie.title,
      releaseDate: movie.release_date ?? null,
      posterPath: movie.poster_path,
    })) ?? [];

  return NextResponse.json({ results });
}
