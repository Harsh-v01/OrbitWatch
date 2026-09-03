import { NAMED_SATELLITES, GROUP_SOURCES, categoryColor } from "../data/trackedSatellites.js";

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";
const TLE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours — TLEs don't change fast enough to warrant more

let cache = {
  builtAt: 0,
  catalog: [] // [{ catalogNumber, name, line1, line2, type, operator, category }]
};

function parseTleBlock(text) {
  const lines = text
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.length > 0);

  const records = [];
  for (let i = 0; i + 2 < lines.length + 1 && i + 2 <= lines.length; i += 3) {
    const name = lines[i]?.trim();
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!name || !line1 || !line2 || !line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;
    const catalogNumber = Number(line1.slice(2, 7));
    records.push({ catalogNumber, name, line1, line2 });
  }
  return records;
}

async function fetchGroup(group) {
  const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=tle`;
  const response = await fetch(url, { headers: { "User-Agent": "OrbitWatch/0.1 (educational project)" } });
  if (!response.ok) throw new Error(`CelesTrak group "${group}" fetch failed: ${response.status}`);
  return parseTleBlock(await response.text());
}

async function fetchByCatalogNumber(catalogNumber) {
  const url = `${CELESTRAK_BASE}?CATNR=${catalogNumber}&FORMAT=tle`;
  const response = await fetch(url, { headers: { "User-Agent": "OrbitWatch/0.1 (educational project)" } });
  if (!response.ok) throw new Error(`CelesTrak catalog #${catalogNumber} fetch failed: ${response.status}`);
  const [record] = parseTleBlock(await response.text());
  return record;
}

function titleCase(name) {
  return name
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\biss\b/gi, "ISS")
    .replace(/\bnoaa\b/gi, "NOAA");
}

async function buildCatalog() {
  const entries = new Map();

  // Named, individually-looked-up objects (source of truth for well-known bodies).
  const namedResults = await Promise.allSettled(
    NAMED_SATELLITES.map((meta) => fetchByCatalogNumber(meta.catalogNumber))
  );

  namedResults.forEach((result, index) => {
    if (result.status !== "fulfilled" || !result.value) return;
    const meta = NAMED_SATELLITES[index];
    const record = result.value;
    entries.set(record.catalogNumber, {
      catalogNumber: record.catalogNumber,
      name: titleCase(record.name),
      line1: record.line1,
      line2: record.line2,
      type: meta.type,
      operator: meta.operator,
      category: meta.category,
      colorKey: categoryColor(meta.category)
    });
  });

  // Bulk constellation groups, sampled down to a manageable handful each.
  const groupResults = await Promise.allSettled(GROUP_SOURCES.map((source) => fetchGroup(source.group)));

  groupResults.forEach((result, index) => {
    if (result.status !== "fulfilled") return;
    const source = GROUP_SOURCES[index];
    const sample = result.value.slice(0, source.limit);
    for (const record of sample) {
      if (entries.has(record.catalogNumber)) continue;
      entries.set(record.catalogNumber, {
        catalogNumber: record.catalogNumber,
        name: titleCase(record.name),
        line1: record.line1,
        line2: record.line2,
        type: source.group === "stations" ? "Space station" : source.group === "weather" ? "Weather" : "Communication",
        operator: source.group === "starlink" ? "SpaceX" : source.group === "oneweb" ? "Eutelsat OneWeb" : "—",
        category: source.category,
        colorKey: categoryColor(source.category)
      });
    }
  });

  return Array.from(entries.values());
}

export async function getCatalog({ forceRefresh = false } = {}) {
  const isStale = Date.now() - cache.builtAt > TLE_TTL_MS;
  if (forceRefresh || isStale || cache.catalog.length === 0) {
    try {
      const catalog = await buildCatalog();
      if (catalog.length > 0) {
        cache = { builtAt: Date.now(), catalog };
      } else if (cache.catalog.length === 0) {
        throw new Error("CelesTrak returned no usable TLE data");
      }
    } catch (error) {
      if (cache.catalog.length === 0) throw error;
      // Serve the stale cache rather than fail the request outright.
      console.warn("TLE refresh failed, serving stale cache:", error.message);
    }
  }
  return cache.catalog;
}

export async function getSatelliteByCatalogNumber(catalogNumber) {
  const catalog = await getCatalog();
  const found = catalog.find((entry) => entry.catalogNumber === Number(catalogNumber));
  if (found) return found;
  // Not in our curated set — try a direct lookup so any valid NORAD id works.
  const record = await fetchByCatalogNumber(catalogNumber);
  if (!record) return null;
  return {
    catalogNumber: record.catalogNumber,
    name: titleCase(record.name),
    line1: record.line1,
    line2: record.line2,
    type: "Unclassified",
    operator: "—",
    category: "other",
    colorKey: "other"
  };
}

export function cacheAgeMs() {
  return cache.builtAt === 0 ? null : Date.now() - cache.builtAt;
}
