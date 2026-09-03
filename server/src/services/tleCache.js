import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as satellite from "satellite.js";

import {
  NAMED_SATELLITES,
  GROUP_SOURCES,
  categoryColor,
} from "../data/trackedSatellites.js";

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";
const SATNOGS_BASE = "https://db.satnogs.org/api";
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;
const PROVIDER_COOLDOWN_MS = 15 * 60 * 1000;
const USER_AGENT = "OrbitWatch/0.2 (educational satellite tracker)";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_FILE = path.resolve(__dirname, "../../data/cache/catalog.json");

export class OrbitalDataUnavailableError extends Error {
  constructor(message = "Orbital data is temporarily unavailable.") {
    super(message);
    this.name = "OrbitalDataUnavailableError";
    this.status = "unavailable";
  }
}

let cache = { builtAt: 0, catalog: [] };
let diskCacheLoaded = false;
let providerRetryAfter = 0;
let activeProvider = null;
let refreshPromise = null;

async function loadDiskCache() {
  if (diskCacheLoaded) return cache.catalog.length > 0;
  diskCacheLoaded = true;

  try {
    const saved = JSON.parse(await fs.readFile(CACHE_FILE, "utf8"));
    if (!saved || !Array.isArray(saved.catalog)) return false;

    const catalog = saved.catalog.map((entry) => {
      if (entry?.format === "tle" && entry.tle?.line1 && entry.tle?.line2) {
        return makeEntryFromTle(entry.tle, entry.meta ?? {}, entry.source ?? "cache");
      }
      if (entry?.omm && typeof entry.omm === "object") {
        return makeEntryFromOmm(entry.omm, entry.meta ?? {}, entry.source ?? "cache");
      }
      return null;
    }).filter(Boolean);

    if (!catalog.length) return false;

    cache = { builtAt: Number(saved.builtAt) || 0, catalog };
    activeProvider = saved.provider ?? "cache";
    console.log(`[OrbitWatch] loaded ${catalog.length} objects from disk cache`);
    return true;
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("[OrbitWatch] could not load disk cache:", error.message);
    }
    return false;
  }
}

async function saveDiskCache(rawRecords, provider) {
  try {
    await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify({ builtAt: Date.now(), provider, catalog: rawRecords }, null, 2),
      "utf8"
    );
    console.log(`[OrbitWatch] orbital catalog saved to disk (${provider})`);
  } catch (error) {
    console.warn("[OrbitWatch] could not save disk cache:", error.message);
  }
}

export async function writeDiskCache(rawRecords) {
  await saveDiskCache(rawRecords, "manual");
}

function markProviderUnavailable() {
  providerRetryAfter = Date.now() + PROVIDER_COOLDOWN_MS;
}

function providerInCooldown() {
  return Date.now() < providerRetryAfter;
}

function cleanName(name) {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\biss\b/gi, "ISS")
    .replace(/\bnoaa\b/gi, "NOAA");
}

function normalizeCatalogNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function metaFor(catalogNumber, sourceMeta = {}) {
  const named = NAMED_SATELLITES.find((item) => item.catalogNumber === catalogNumber);
  return { ...(named ?? {}), ...sourceMeta };
}

function inferType(source) {
  if (source.category === "station") return "Space station";
  if (source.category === "weather") return "Weather";
  if (source.category === "science") return "Earth observation";
  return "Active satellite";
}

function baseEntry({
  catalogNumber,
  name,
  tleName,
  satrec,
  epoch = null,
  meta = {},
  source,
  objectId = null,
  periodMinutes = null,
  inclination = null,
  apogeeKm = null,
  perigeeKm = null,
}) {
  const merged = metaFor(catalogNumber, meta);
  const category = merged.category ?? "other";

  return {
    catalogNumber,
    name: cleanName(merged.mission || name || `NORAD ${catalogNumber}`),
    tleName: cleanName(tleName || name || `NORAD ${catalogNumber}`),
    satrec,
    epoch,
    type: merged.type ?? "Active satellite",
    operator: merged.operator ?? "—",
    category,
    colorKey: categoryColor(category),
    country: merged.country ?? null,
    mission: merged.mission ?? null,
    featured: merged.country === "India",
    objectId,
    periodMinutes: Number.isFinite(Number(periodMinutes)) ? Number(periodMinutes) : null,
    inclination: Number.isFinite(Number(inclination)) ? Number(inclination) : null,
    apogeeKm: Number.isFinite(Number(apogeeKm)) ? Number(apogeeKm) : null,
    perigeeKm: Number.isFinite(Number(perigeeKm)) ? Number(perigeeKm) : null,
    source,
  };
}

function makeEntryFromOmm(record, meta = {}, source = "celestrak") {
  const catalogNumber = normalizeCatalogNumber(record?.NORAD_CAT_ID);
  if (catalogNumber === null) return null;

  try {
    const satrec = satellite.json2satrec(record);
    const epoch = record.EPOCH ? new Date(`${record.EPOCH}Z`) : null;

    return baseEntry({
      catalogNumber,
      name: record.OBJECT_NAME,
      tleName: record.OBJECT_NAME,
      satrec,
      epoch: epoch && Number.isFinite(epoch.getTime()) ? epoch.toISOString() : null,
      meta,
      source,
      objectId: record.OBJECT_ID ?? null,
      periodMinutes: record.PERIOD,
      inclination: record.INCLINATION,
      apogeeKm: record.APOGEE,
      perigeeKm: record.PERIGEE,
    });
  } catch (error) {
    console.warn(`[OrbitWatch] could not initialize OMM ${catalogNumber}:`, error.message);
    return null;
  }
}

function makeEntryFromTle(record, meta = {}, source = "satnogs") {
  const catalogNumber = normalizeCatalogNumber(
    record?.norad_cat_id ?? record?.NORAD_CAT_ID ?? record?.catalogNumber ?? record?.id
  );
  const line1 = record?.line1 ?? record?.tle1 ?? record?.TLE1;
  const line2 = record?.line2 ?? record?.tle2 ?? record?.TLE2;
  if (catalogNumber === null || !line1 || !line2) return null;

  try {
    const satrec = satellite.twoline2satrec(String(line1).trim(), String(line2).trim());
    const name = record?.name ?? record?.satellite_name ?? record?.object_name ?? record?.tle0 ?? `NORAD ${catalogNumber}`;

    return baseEntry({
      catalogNumber,
      name,
      tleName: name,
      satrec,
      epoch: satrec.epochyr != null && satrec.epochdays != null
        ? null
        : null,
      meta,
      source,
    });
  } catch (error) {
    return null;
  }
}

async function fetchJson(url, provider) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const error = new OrbitalDataUnavailableError(`${provider} request failed: ${response.status}`);
    error.httpStatus = response.status;
    throw error;
  }

  return response.json();
}

async function fetchText(url, provider) {
  const response = await fetch(url, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/plain",
    },
  });

  if (!response.ok) {
    const error = new OrbitalDataUnavailableError(`${provider} request failed: ${response.status}`);
    error.httpStatus = response.status;
    throw error;
  }

  return response.text();
}

function shouldStopCelesTrak(error) {
  return !error?.httpStatus || [403, 404].includes(error.httpStatus) || error.httpStatus >= 500;
}

async function fetchCelestrakGroup(group) {
  const url = `${CELESTRAK_BASE}?GROUP=${encodeURIComponent(group)}&FORMAT=JSON`;
  const data = await fetchJson(url, "CelesTrak");
  if (!Array.isArray(data)) throw new Error(`Unexpected CelesTrak response for ${group}`);
  return data;
}

async function fetchCelestrakByCatalogNumber(catalogNumber) {
  const url = `${CELESTRAK_BASE}?CATNR=${catalogNumber}&FORMAT=JSON`;
  const data = await fetchJson(url, "CelesTrak");
  return Array.isArray(data) && data.length ? data[0] : null;
}

function extractSatnogsJsonRecords(data) {
  const records = Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [];
  return records.map((record) => {
    const normalized = {
      norad_cat_id: record.norad_cat_id ?? record.NORAD_CAT_ID ?? record.catalog_number ?? record.id,
      sat_id: record.sat_id ?? record.satellite_id,
      name: record.name ?? record.satellite_name ?? record.object_name,
      tle1: record.tle1 ?? record.line1 ?? record.TLE1,
      tle2: record.tle2 ?? record.line2 ?? record.TLE2,
      tle0: record.tle0 ?? record.line0 ?? record.TLE0,
    };
    return normalized;
  }).filter((record) => record.norad_cat_id != null && record.tle1 && record.tle2);
}

function parseThreeLineTle(text) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const records = [];

  for (let i = 0; i < lines.length; i += 1) {
    if (!lines[i].startsWith("1 ") || i + 1 >= lines.length || !lines[i + 1].startsWith("2 ")) continue;
    const line1 = lines[i];
    const line2 = lines[i + 1];
    const name = i > 0 && !lines[i - 1].startsWith("1 ") && !lines[i - 1].startsWith("2 ")
      ? lines[i - 1]
      : undefined;
    const match = line1.match(/^1\s+([A-Z0-9-]+)/);
    records.push({ norad_cat_id: match?.[1], name, tle1: line1, tle2: line2 });
    i += 1;
  }

  return records;
}

async function fetchSatnogsCatalog() {
  const jsonUrl = `${SATNOGS_BASE}/tle/?format=json`;
  try {
    const data = await fetchJson(jsonUrl, "SatNOGS");
    const records = extractSatnogsJsonRecords(data);
    if (records.length) return records;
  } catch (error) {
    console.warn("[OrbitWatch] SatNOGS JSON feed unavailable:", error.message);
  }

  const text = await fetchText(`${SATNOGS_BASE}/tle/?format=3le`, "SatNOGS");
  const records = parseThreeLineTle(text);
  if (!records.length) throw new OrbitalDataUnavailableError("SatNOGS returned no usable TLE records");
  return records;
}

function buildFromRecords(records, source, metadataById = new Map()) {
  const entries = new Map();
  const rawRecords = [];

  for (const record of records) {
    const id = normalizeCatalogNumber(record.NORAD_CAT_ID ?? record.norad_cat_id);
    if (id === null || entries.has(id)) continue;

    const meta = metadataById.get(id) ?? {};
    const entry = source === "celestrak"
      ? makeEntryFromOmm(record, meta, source)
      : makeEntryFromTle(record, meta, source);

    if (!entry) continue;

    entries.set(id, entry);
    rawRecords.push(source === "celestrak"
      ? { format: "omm", omm: record, meta, source }
      : { format: "tle", tle: { line1: record.tle1, line2: record.tle2 }, meta, source });
  }

  return { entries, rawRecords };
}

async function buildCelestrakCatalog() {
  const records = [];
  const metadataById = new Map();

  for (const source of GROUP_SOURCES) {
    try {
      const groupRecords = await fetchCelestrakGroup(source.group);
      for (const record of groupRecords.slice(0, source.limit)) {
        const id = normalizeCatalogNumber(record.NORAD_CAT_ID);
        if (id === null || metadataById.has(id)) continue;
        metadataById.set(id, { type: inferType(source), category: source.category });
        records.push(record);
      }
    } catch (error) {
      console.warn(`[OrbitWatch] CelesTrak group ${source.group} unavailable:`, error.message);
      if (shouldStopCelesTrak(error)) throw error;
    }
  }

  for (const meta of NAMED_SATELLITES) {
    if (records.some((record) => Number(record.NORAD_CAT_ID) === meta.catalogNumber)) continue;

    try {
      const record = await fetchCelestrakByCatalogNumber(meta.catalogNumber);
      if (record) records.push(record);
    } catch (error) {
      console.warn(`[OrbitWatch] named satellite ${meta.catalogNumber} unavailable:`, error.message);
      if (shouldStopCelesTrak(error)) throw error;
    }
  }

  const result = buildFromRecords(records, "celestrak", metadataById);
  return { catalog: Array.from(result.entries.values()).sort((a,b) => Number(b.featured)-Number(a.featured)), rawRecords: result.rawRecords };
}

async function buildSatnogsCatalog() {
  const records = await fetchSatnogsCatalog();
  const metadataById = new Map(NAMED_SATELLITES.map((meta) => [meta.catalogNumber, meta]));
  const result = buildFromRecords(records, "satnogs", metadataById);

  /*
   * SatNOGS is a broad community TLE database. We keep every
   * usable record, then sort OrbitWatch's known/Indian missions
   * to the front without inventing metadata for unknown objects.
   */
  const catalog = Array.from(result.entries.values()).sort((a,b) => Number(b.featured)-Number(a.featured));

  return { catalog, rawRecords: result.rawRecords };
}

async function refreshCatalog() {
  try {
    let result;

    try {
      result = await buildCelestrakCatalog();
      activeProvider = "CelesTrak";
    } catch (celestrakError) {
      console.warn("[OrbitWatch] CelesTrak unavailable; trying SatNOGS fallback:", celestrakError.message);
      result = await buildSatnogsCatalog();
      activeProvider = "SatNOGS";
    }

    if (!result.catalog.length) {
      throw new OrbitalDataUnavailableError("No usable orbital records were returned by the configured providers");
    }

    cache = { builtAt: Date.now(), catalog: result.catalog };
    providerRetryAfter = 0;
    await saveDiskCache(result.rawRecords, activeProvider);

    console.log(`[OrbitWatch] catalog refreshed from ${activeProvider}: ${result.catalog.length} objects`);
    return cache.catalog;
  } catch (error) {
    markProviderUnavailable();

    if (cache.catalog.length) {
      console.warn("[OrbitWatch] refresh failed; serving stale catalog:", error.message);
      return cache.catalog;
    }

    throw new OrbitalDataUnavailableError(
      `Orbital providers are unavailable and no cached catalog is available. ${error.message}`
    );
  }
}

export async function getCatalog({ forceRefresh = false } = {}) {
  await loadDiskCache();

  const stale = cache.builtAt === 0 || Date.now() - cache.builtAt > CACHE_TTL_MS;

  if (!forceRefresh && !stale && cache.catalog.length) return cache.catalog;

  if (!forceRefresh && providerInCooldown() && cache.catalog.length) return cache.catalog;

  if (refreshPromise) return refreshPromise;

  refreshPromise = refreshCatalog();
  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

export async function getSatelliteByCatalogNumber(catalogNumber) {
  const id = Number(catalogNumber);
  if (!Number.isFinite(id)) return null;

  const catalog = await getCatalog();
  return catalog.find((entry) => entry.catalogNumber === id) ?? null;
}

export async function initializeOrbitalCache() {
  await loadDiskCache();
}

export function cacheAgeMs() {
  return cache.builtAt ? Date.now() - cache.builtAt : null;
}

export function cacheInfo() {
  const ageMs = cacheAgeMs();
  return {
    builtAt: cache.builtAt || null,
    ageMs,
    count: cache.catalog.length,
    cached: cache.catalog.length > 0,
    stale: cache.builtAt === 0 || ageMs > CACHE_TTL_MS,
    status: cache.catalog.length ? (ageMs > CACHE_TTL_MS ? "stale" : "ready") : "unavailable",
    provider: {
      name: activeProvider ?? "none",
      retryAfter: providerRetryAfter || null,
      inCooldown: providerInCooldown(),
    },
  };
}
