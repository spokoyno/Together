import { NextResponse } from "next/server";

type RawgGame = {
  id: number;
  name: string;
  released?: string;
  background_image?: string | null;
};

export async function GET(request: Request) {
  const apiKey = process.env.RAWG_API_KEY;
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  if (!apiKey) {
    return NextResponse.json({
      results: [],
      error: "RAWG_API_KEY не настроен. См. docs/API_KEYS.md",
    });
  }

  const url = new URL("https://api.rawg.io/api/games");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "12");

  const response = await fetch(url, { next: { revalidate: 3600 } });

  if (!response.ok) {
    return NextResponse.json({ results: [], error: "Ошибка поиска игр" }, { status: 502 });
  }

  const payload = (await response.json()) as { results?: RawgGame[] };

  const results =
    payload.results?.slice(0, 12).map((game) => ({
      id: game.id,
      title: game.name,
      posterUrl: game.background_image ?? null,
      year: game.released?.slice(0, 4) ?? null,
    })) ?? [];

  return NextResponse.json({ results });
}
