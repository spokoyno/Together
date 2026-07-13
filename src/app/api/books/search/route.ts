import { NextResponse } from "next/server";

type OpenLibraryDoc = {
  key?: string;
  title?: string;
  author_name?: string[];
  cover_i?: number;
  first_publish_year?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const url = new URL("https://openlibrary.org/search.json");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", "12");
    url.searchParams.set("fields", "key,title,author_name,cover_i,first_publish_year");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [], error: "Book search unavailable" }, { status: 502 });
    }

    const payload = (await response.json()) as { docs?: OpenLibraryDoc[] };
    const results = (payload.docs ?? [])
      .filter((doc) => doc.title && doc.key)
      .map((doc) => ({
        id: doc.key!,
        title: doc.title!,
        author: doc.author_name?.[0] ?? null,
        year: doc.first_publish_year ?? null,
        coverUrl: doc.cover_i
          ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg`
          : null,
      }));

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Book search failed" }, { status: 502 });
  }
}
