import { NextResponse } from "next/server";

type TierMakerResult = {
  title: string;
  url: string;
};

function normalizeTierMakerUrl(raw: string): string {
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }
  return `https://tiermaker.com${raw.startsWith("/") ? raw : `/${raw}`}`;
}

function parseTierMakerSearch(html: string): TierMakerResult[] {
  const results: TierMakerResult[] = [];
  const seen = new Set<string>();

  const patterns = [
    /<a[^>]+href="(https?:\/\/tiermaker\.com\/create\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]+href="(\/create\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
  ];

  for (const regex of patterns) {
    let match = regex.exec(html);
    while (match) {
      const url = normalizeTierMakerUrl(match[1]);
      const title = match[2].replace(/\s+/g, " ").trim();

      if (title.length < 2 || seen.has(url)) {
        match = regex.exec(html);
        continue;
      }

      seen.add(url);
      results.push({ title, url });

      if (results.length >= 12) {
        return results;
      }

      match = regex.exec(html);
    }
  }

  return results;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const response = await fetch(`https://tiermaker.com/search/?q=${encodeURIComponent(query)}`, {
      headers: {
        "User-Agent": "couple-pre-mvp/1.0",
        Accept: "text/html",
      },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ results: [], error: "TierMaker недоступен" }, { status: 502 });
    }

    const html = await response.text();
    const results = parseTierMakerSearch(html);

    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Не удалось выполнить поиск" }, { status: 502 });
  }
}
