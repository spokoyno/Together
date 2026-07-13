import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataDir = path.join(__dirname, "i18n-locale-data");
const locales = ["uk", "es", "de", "it", "zh", "hi", "pt", "ja", "tr", "fr", "ko"];

const { enCatalog } = await import(
  pathToFileURL(path.join(root, "src/lib/i18n/en-catalog.ts")).href
);
const enKeys = Object.keys(enCatalog);

for (const locale of locales) {
  const filePath = path.join(dataDir, `${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  let added = 0;

  for (const key of enKeys) {
    if (!(key in data)) {
      data[key] = enCatalog[key];
      added += 1;
    }
  }

  const sorted = Object.fromEntries(
    enKeys.map((key) => [key, data[key] ?? enCatalog[key]]),
  );

  fs.writeFileSync(filePath, `${JSON.stringify(sorted, null, 2)}\n`, "utf8");
  console.log(`${locale}: synced (${added} new keys)`);
}
