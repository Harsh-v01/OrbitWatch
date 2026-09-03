import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import * as satellite from "satellite.js";

import {
  NAMED_SATELLITES,
  GROUP_SOURCES,
  categoryColor
} from "../data/trackedSatellites.js";

const CELESTRAK_BASE =
  "https://celestrak.org/NORAD/elements/gp.php";

const CACHE_TTL_MS =
  2 * 60 * 60 * 1000;

const CELESTRAK_RETRY_COOLDOWN_MS =
  15 * 60 * 1000;

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const CACHE_FILE =
  path.resolve(
    __dirname,
    "../../data/cache/catalog.json"
  );

const USER_AGENT =
  "OrbitWatch/0.2 (educational satellite tracker)";

export class OrbitalDataUnavailableError extends Error {
  constructor(
    message =
      "Orbital data is temporarily unavailable."
  ) {
    super(message);
    this.name =
      "OrbitalDataUnavailableError";
    this.status =
      "unavailable";
  }
}

let cache = {
  builtAt: 0,
  catalog: []
};

let diskCacheLoaded = false;

let celestrakRetryAfter = 0;

let refreshPromise = null;


// =========================================================
// DISK CACHE
// =========================================================

async function loadDiskCache() {
  if (diskCacheLoaded) {
    return cache.catalog.length > 0;
  }

  diskCacheLoaded = true;

  try {
    const text =
      await fs.readFile(
        CACHE_FILE,
        "utf8"
      );

    const saved =
      JSON.parse(text);

    if (
      !saved ||
      !Array.isArray(saved.catalog)
    ) {
      return false;
    }

    /*
     * satrec objects cannot be serialized.
     *
     * The disk cache therefore stores the original
     * CelesTrak OMM record plus our OrbitWatch metadata.
     *
     * When the server starts, we rebuild satrec objects
     * using satellite.json2satrec().
     */

    const catalog =
      saved.catalog
        .map((entry) => {
          if (
            !entry?.omm ||
            typeof entry.omm !== "object"
          ) {
            return null;
          }

          return makeEntry(
            entry.omm,
            entry.meta ?? {}
          );
        })
        .filter(Boolean);

    if (catalog.length === 0) {
      return false;
    }

    cache = {
      builtAt:
        Number(saved.builtAt) || 0,

      catalog
    };

    console.log(
      `[OrbitWatch] loaded ${catalog.length} objects from disk cache`
    );

    return true;

  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn(
        "[OrbitWatch] could not load disk cache:",
        error.message
      );
    }

    return false;
  }
}


async function saveDiskCache(rawRecords) {
  try {
    await fs.mkdir(
      path.dirname(CACHE_FILE),
      {
        recursive: true
      }
    );

    await fs.writeFile(
      CACHE_FILE,
      JSON.stringify(
        {
          builtAt: Date.now(),
          catalog: rawRecords
        },
        null,
        2
      ),
      "utf8"
    );

    console.log(
      "[OrbitWatch] orbital catalog saved to disk"
    );

  } catch (error) {
    console.warn(
      "[OrbitWatch] could not save disk cache:",
      error.message
    );
  }
}

export async function writeDiskCache(rawRecords) {
  await saveDiskCache(rawRecords);
}


// =========================================================
// CELESTRAK REQUESTS
// =========================================================

function shouldStopCelesTrakRequests(error) {
  if (!error.status) {
    return true;
  }

  return (
    error.status === 403 ||
    error.status === 404 ||
    error.status >= 500
  );
}

function celestrakInCooldown() {
  return Date.now() <
    celestrakRetryAfter;
}

function markCelesTrakUnavailable() {
  celestrakRetryAfter =
    Date.now() +
    CELESTRAK_RETRY_COOLDOWN_MS;
}

async function fetchJson(url) {
  const response =
    await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json"
      }
    });

  if (!response.ok) {
    const error = new Error(
      `CelesTrak request failed: ${response.status}`
    );

    error.status = response.status;

    throw new OrbitalDataUnavailableError(
      error.message
    );
  }

  return response.json();
}


async function fetchGroup(group) {
  const url =
    `${CELESTRAK_BASE}` +
    `?GROUP=${encodeURIComponent(group)}` +
    `&FORMAT=JSON`;

  const data =
    await fetchJson(url);

  if (!Array.isArray(data)) {
    throw new Error(
      `Unexpected CelesTrak response for group ${group}`
    );
  }

  return data;
}


async function fetchByCatalogNumber(catalogNumber) {
  const url =
    `${CELESTRAK_BASE}` +
    `?CATNR=${catalogNumber}` +
    `&FORMAT=JSON`;

  const data =
    await fetchJson(url);

  if (
    !Array.isArray(data) ||
    data.length === 0
  ) {
    return null;
  }

  return data[0];
}


// =========================================================
// NORMALIZATION
// =========================================================

function cleanName(name) {
  return String(name ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\biss\b/gi, "ISS")
    .replace(/\bnoaa\b/gi, "NOAA");
}


function normalizeCatalogNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function makeEntry(record, meta = {}) {
  const catalogNumber =
    normalizeCatalogNumber(
      record.NORAD_CAT_ID
    );

  if (catalogNumber === null) {
    return null;
  }

  const category =
    meta.category ?? "other";

  let satrec;

  try {
    satrec =
      satellite.json2satrec(record);

  } catch (error) {
    console.warn(
      `[OrbitWatch] Could not initialize SGP4 for ${catalogNumber}:`,
      error.message
    );

    return null;
  }

  const name =
    cleanName(
      meta.mission ||
      record.OBJECT_NAME ||
      `NORAD ${catalogNumber}`
    );

  return {
    catalogNumber,

    name,

    tleName:
      cleanName(
        record.OBJECT_NAME ||
        name
      ),

    satrec,

    epoch:
      record.EPOCH
        ? new Date(
            `${record.EPOCH}Z`
          ).toISOString()
        : null,

    type:
      meta.type ??
      "Active satellite",

    operator:
      meta.operator ??
      "—",

    category,

    colorKey:
      categoryColor(category),

    country:
      meta.country ??
      null,

    mission:
      meta.mission ??
      null,

    featured:
      meta.country === "India",

    objectId:
      record.OBJECT_ID ??
      null,

    periodMinutes:
      Number.isFinite(
        Number(record.PERIOD)
      )
        ? Number(record.PERIOD)
        : null,

    inclination:
      Number.isFinite(
        Number(record.INCLINATION)
      )
        ? Number(record.INCLINATION)
        : null,

    apogeeKm:
      Number.isFinite(
        Number(record.APOGEE)
      )
        ? Number(record.APOGEE)
        : null,

    perigeeKm:
      Number.isFinite(
        Number(record.PERIGEE)
      )
        ? Number(record.PERIGEE)
        : null
  };
}


function inferType(source) {
  if (source.category === "station") {
    return "Space station";
  }

  if (source.category === "weather") {
    return "Weather";
  }

  if (source.category === "science") {
    return "Earth observation";
  }

  return "Active satellite";
}


// =========================================================
// BUILD CATALOG
// =========================================================

async function buildCatalog() {
  const entries =
    new Map();

  const rawRecords =
    new Map();

  let celestrakUnavailable =
    false;


  /*
   * -------------------------------------------------------
   * STEP 1
   * Fetch larger groups first.
   *
   * Requests are deliberately SEQUENTIAL.
   *
   * If CelesTrak is unreachable or returns a hard failure,
   * immediately stop making more requests.
   * -------------------------------------------------------
   */

  for (const source of GROUP_SOURCES) {
    try {
      const records =
        await fetchGroup(
          source.group
        );

      const limitedRecords =
        records.slice(
          0,
          source.limit
        );

      for (const record of limitedRecords) {
        const catalogNumber =
          normalizeCatalogNumber(
            record.NORAD_CAT_ID
          );

        if (
          catalogNumber === null ||
          entries.has(catalogNumber)
        ) {
          continue;
        }

        const meta = {
          type:
            inferType(source),

          category:
            source.category
        };

        const entry =
          makeEntry(
            record,
            meta
          );

        if (!entry) {
          continue;
        }

        entries.set(
          entry.catalogNumber,
          entry
        );

        rawRecords.set(
          entry.catalogNumber,
          {
            omm: record,
            meta
          }
        );
      }

    } catch (error) {
      console.warn(
        `[OrbitWatch] CelesTrak group ${source.group} unavailable:`,
        error.message
      );

      /*
       * Do not continue hammering the remaining groups
       * after connection errors or hard HTTP failures.
       */

      if (shouldStopCelesTrakRequests(error)) {
        celestrakUnavailable =
          true;

        markCelesTrakUnavailable();

        console.warn(
          "[OrbitWatch] stopping CelesTrak downloads and using cached data if available."
        );

        break;
      }
    }
  }


  /*
   * -------------------------------------------------------
   * STEP 2
   * Add important named satellites.
   *
   * Only request satellites that were not already found
   * in the group downloads.
   *
   * This greatly reduces the number of CelesTrak requests.
   * -------------------------------------------------------
   */

  if (!celestrakUnavailable) {
    for (const meta of NAMED_SATELLITES) {
      if (
        entries.has(
          meta.catalogNumber
        )
      ) {
        continue;
      }

      try {
        const record =
          await fetchByCatalogNumber(
            meta.catalogNumber
          );

        if (!record) {
          continue;
        }

        const entry =
          makeEntry(
            record,
            meta
          );

        if (!entry) {
          continue;
        }

        entries.set(
          entry.catalogNumber,
          entry
        );

        rawRecords.set(
          entry.catalogNumber,
          {
            omm: record,
            meta
          }
        );

      } catch (error) {
        console.warn(
          `[OrbitWatch] named satellite ${meta.catalogNumber} unavailable:`,
          error.message
        );

        if (shouldStopCelesTrakRequests(error)) {
          celestrakUnavailable =
            true;

          markCelesTrakUnavailable();

          console.warn(
            "[OrbitWatch] stopping named satellite downloads."
          );

          break;
        }
      }
    }
  }


  /*
   * -------------------------------------------------------
   * STEP 3
   * Sort featured satellites first.
   * -------------------------------------------------------
   */

  const catalog =
    Array
      .from(entries.values())
      .sort(
        (a, b) =>
          Number(b.featured) -
          Number(a.featured)
      );


  return {
    incomplete:
      celestrakUnavailable,

    catalog,

    rawRecords:
      Array.from(
        rawRecords.values()
      )
  };
}


// =========================================================
// PUBLIC CATALOG API
// =========================================================

async function refreshCatalog() {
  try {
    const result =
      await buildCatalog();

    if (
      result.incomplete &&
      cache.catalog.length > 0
    ) {
      throw new Error(
        "CelesTrak became unavailable before catalog refresh completed"
      );
    }

    if (
      result.catalog.length === 0
    ) {
      throw new Error(
        "CelesTrak returned no usable orbital data"
      );
    }


    cache = {
      builtAt: Date.now(),
      catalog:
        result.catalog
    };


    await saveDiskCache(
      result.rawRecords
    );


    console.log(
      `[OrbitWatch] catalog refreshed: ${result.catalog.length} objects`
    );

  } catch (error) {

    if (
      cache.catalog.length > 0
    ) {
      console.warn(
        "[OrbitWatch] refresh failed; serving stale catalog:",
        error.message
      );

      return cache.catalog;
    }

    throw error;
  }


  return cache.catalog;
}

export async function getCatalog({
  forceRefresh = false
} = {}) {

  /*
   * IMPORTANT:
   *
   * On the first call after server startup,
   * load the persistent disk cache.
   */

  await loadDiskCache();


  const stale =
    Date.now() -
    cache.builtAt >
    CACHE_TTL_MS;


  /*
   * Fresh in-memory/disk cache.
   *
   * No CelesTrak request.
   */

  if (
    !forceRefresh &&
    !stale &&
    cache.catalog.length > 0
  ) {
    return cache.catalog;
  }


  if (
    !forceRefresh &&
    celestrakInCooldown()
  ) {
    if (
      cache.catalog.length > 0
    ) {
      return cache.catalog;
    }

    throw new OrbitalDataUnavailableError(
      "Orbital data provider is unavailable and no cached catalog is available"
    );
  }


  if (refreshPromise) {
    return refreshPromise;
  }


  /*
   * If the disk cache is stale but usable, we still try
   * one refresh after the provider cooldown expires.
   *
   * If CelesTrak rejects us, the stale catalog survives.
   */

  refreshPromise =
    refreshCatalog();

  try {
    return await refreshPromise;

  } finally {
    refreshPromise = null;
  }
}


// =========================================================
// SINGLE SATELLITE LOOKUP
// =========================================================

export async function getSatelliteByCatalogNumber(
  catalogNumber
) {
  const id = Number(catalogNumber);

  if (!Number.isFinite(id)) {
    return null;
  }

  const catalog = await getCatalog();

  const found = catalog.find(
    (entry) => entry.catalogNumber === id
  );

  if (found) {
    return found;
  }

  /*
   * Do not make another CelesTrak request here.
   *
   * If the satellite isn't in our cached/loaded catalog,
   * the caller should treat it as unavailable.
   *
   * This prevents individual satellite requests from
   * hammering an unavailable upstream provider.
   */
  return null;
}

export async function initializeOrbitalCache() {
  await loadDiskCache();
}


// =========================================================
// CACHE INFO
// =========================================================

export function cacheAgeMs() {
  if (
    cache.builtAt === 0
  ) {
    return null;
  }

  return (
    Date.now() -
    cache.builtAt
  );
}


export function cacheInfo() {
  const ageMs =
    cacheAgeMs();

  return {
    builtAt:
      cache.builtAt ||
      null,

    ageMs:
      ageMs,

    count:
      cache.catalog.length,

    cached:
      cache.catalog.length > 0,

    stale:
      cache.builtAt === 0 ||
      Date.now() -
        cache.builtAt >
        CACHE_TTL_MS,

    status:
      cache.catalog.length > 0
        ? ageMs !== null &&
          ageMs > CACHE_TTL_MS
          ? "stale"
          : "ready"
        : "unavailable",

    provider:
      {
        name: "CelesTrak",
        retryAfter:
          celestrakRetryAfter || null,
        inCooldown:
          celestrakInCooldown()
      }
  };
}
