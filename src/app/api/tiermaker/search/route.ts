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
    /<a[^>]+href="(https?:\/\/(?:www\.)?tiermaker\.com\/create\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
    /<a[^>]+href="(\/create\/[^"]+)"[^>]*>([^<]+)<\/a>/gi,
    /href="(https?:\/\/(?:www\.)?tiermaker\.com\/create\/[^"]+)"[^>]*title="([^"]+)"/gi,
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

async function fetchTierMakerHtml(query: string): Promise<string | null> {
  const urls = [
    `https://tiermaker.com/search/?q=${encodeURIComponent(query)}`,
    `https://www.tiermaker.com/search/?q=${encodeURIComponent(query)}`,
    `https://tiermaker.com/search?q=${encodeURIComponent(query)}`,
  ];

  for (const url of urls) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        cache: "no-store",
      });

      if (response.ok) {
        return await response.text();
      }
    } catch {
      // try next URL
    }
  }

  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  try {
    const html = await fetchTierMakerHtml(query);

    if (!html) {
      return NextResponse.json(
        { results: [], error: "TierMaker unavailable — paste a link manually" },
        { status: 502 },
      );
    }

    const results = parseTierMakerSearch(html);
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 502 });
  }
}
