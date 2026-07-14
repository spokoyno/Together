export function tierTitleFromUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    const segments = parsed.pathname.split("/").filter(Boolean);
    const slug = segments[segments.length - 1] ?? "tier-list";
    const title = decodeURIComponent(slug).replace(/[-_+]+/g, " ").trim();
    return title.slice(0, 160) || "Tier list";
  } catch {
    return "Tier list";
  }
}

export function isTierMakerUrl(url: string): boolean {
  try {
    const host = new URL(url.trim()).hostname.toLowerCase();
    return host === "tiermaker.com" || host.endsWith(".tiermaker.com");
  } catch {
    return false;
  }
}

export function tierMakerSearchUrl(query: string): string {
  return `https://tiermaker.com/search/?q=${encodeURIComponent(query.trim())}`;
}
