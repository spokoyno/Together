import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(__dirname, "i18n-locale-data");
const outPath = path.join(root, "src/lib/i18n/locale-overrides.ts");

const locales = ["uk", "es", "de", "it", "zh", "hi", "pt", "ja", "tr", "fr", "ko"];

const { enCatalog } = await import(pathToFileURL(path.join(root, "src/lib/i18n/en-catalog.ts")).href);
const enKeys = Object.keys(enCatalog);

/** @type {Record<string, Record<string, string>>} */
const translations = {};

for (const locale of locales) {
  const filePath = path.join(dataDir, `${locale}.json`);
  translations[locale] = JSON.parse(fs.readFileSync(filePath, "utf8"));
}
for (const locale of locales) {
  const keys = Object.keys(translations[locale]);
  const missing = enKeys.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !enKeys.includes(key));
  if (missing.length || extra.length) {
    throw new Error(`${locale}: missing=${missing.join(",")} extra=${extra.join(",")}`);
  }
}

function serializeLocale(locale, data) {
  const lines = Object.entries(data).map(
    ([key, value]) => `    ${key}: ${JSON.stringify(value)},`,
  );
  return `  ${locale}: {\n${lines.join("\n")}\n  }`;
}

const body = `import type { Locale } from "@/lib/i18n/constants";
import { enCatalog } from "@/lib/i18n/en-catalog";

type CatalogKey = keyof typeof enCatalog;
type CatalogOverride = Partial<Record<CatalogKey, string>>;

export const localeOverrides: Record<Locale, CatalogOverride> = {
  en: {},
${locales.map((locale) => serializeLocale(locale, translations[locale])).join(",\n")},
};
`;

fs.writeFileSync(outPath, body, "utf8");
console.log(`Wrote ${outPath} (${enKeys.length} keys × ${locales.length} locales)`);
