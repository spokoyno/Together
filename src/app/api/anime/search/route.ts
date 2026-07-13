import { NextResponse } from "next/server";
import { fetchJsonWithTimeout } from "@/lib/api/fetch-json";

type AniListMedia = {
  id: number;
  title?: { userPreferred?: string; romaji?: string };
  coverImage?: { large?: string };
  seasonYear?: number | null;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const response = await fetchJsonWithTimeout<{
    data?: { Page?: { media?: AniListMedia[] } };
  }>("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query: `
        query ($search: String) {
          Page(perPage: 12) {
            media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
              id
              title { userPreferred romaji }
              coverImage { large }
              seasonYear
            }
          }
        }
      `,
      variables: { search: query },
    }),
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    return NextResponse.json({ results: [], error: "Ошибка поиска аниме" }, { status: 502 });
  }

  const payload = response.data;

  const results =
    payload.data?.Page?.media?.map((item) => ({
      id: item.id,
      title: item.title?.userPreferred ?? item.title?.romaji ?? "Без названия",
      posterUrl: item.coverImage?.large ?? null,
      year: item.seasonYear ? String(item.seasonYear) : null,
    })) ?? [];

  return NextResponse.json({ results });
}
