import fs from "node:fs/promises";
import path from "node:path";

import * as satellite from "satellite.js";

import {
  NAMED_SATELLITES,
  GROUP_SOURCES
} from "../data/trackedSatellites.js";
import { writeDiskCache } from "../services/tleCache.js";

function usage() {
  console.log(
    [
      "Usage:",
      "  npm run import-cache -- <path-to-celestrak-json> [--group=stations]",
      "",
      "The input must be real CelesTrak JSON/OMM data or an OrbitWatch cache file.",
      "No orbital elements are generated or filled in by this script."
    ].join("\n")
  );
}

function parseArgs(argv) {
  const args = {
    file: null,
    group: null
  };

  for (const arg of argv) {
    if (arg.startsWith("--group=")) {
      args.group =
        arg.slice("--group=".length);
    } else if (!args.file) {
      args.file = arg;
    }
  }

  return args;
}

function normalizeCatalogNumber(value) {
  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function inferType(category) {
  if (category === "station") {
    return "Space station";
  }

  if (category === "weather") {
    return "Weather";
  }

  if (category === "science") {
    return "Earth observation";
  }

  return "Active satellite";
}

function metadataFor(record, group) {
  const catalogNumber =
    normalizeCatalogNumber(
      record.NORAD_CAT_ID
    );

  const named =
    NAMED_SATELLITES.find(
      (satellite) =>
        satellite.catalogNumber === catalogNumber
    );

  if (named) {
    return named;
  }

  const source =
    GROUP_SOURCES.find(
      (candidate) =>
        candidate.group === group
    );

  if (source) {
    return {
      type:
        inferType(source.category),
      category:
        source.category
    };
  }

  return {
    type: "Active satellite",
    category: "other"
  };
}

function unwrapRecords(parsed) {
  if (Array.isArray(parsed)) {
    return parsed.map(
      (record) => ({
        omm: record,
        meta: null
      })
    );
  }

  if (
    parsed &&
    Array.isArray(parsed.catalog)
  ) {
    return parsed.catalog.map(
      (entry) => ({
        omm: entry.omm ?? entry,
        meta: entry.meta ?? null
      })
    );
  }

  throw new Error(
    "Input JSON must be an OMM array or an OrbitWatch cache object with a catalog array."
  );
}

function validateOmm(record) {
  const catalogNumber =
    normalizeCatalogNumber(
      record?.NORAD_CAT_ID
    );

  if (
    catalogNumber === null ||
    !record?.EPOCH
  ) {
    return null;
  }

  satellite.json2satrec(record);

  return catalogNumber;
}

async function main() {
  const args =
    parseArgs(
      process.argv.slice(2)
    );

  if (!args.file) {
    usage();
    process.exitCode = 1;
    return;
  }

  const inputPath =
    path.resolve(args.file);

  const text =
    await fs.readFile(
      inputPath,
      "utf8"
    );

  const parsed =
    JSON.parse(text);

  const imported =
    new Map();

  let rejected = 0;

  for (const item of unwrapRecords(parsed)) {
    try {
      const catalogNumber =
        validateOmm(item.omm);

      if (catalogNumber === null) {
        rejected += 1;
        continue;
      }

      imported.set(
        catalogNumber,
        {
          omm: item.omm,
          meta:
            item.meta ??
            metadataFor(
              item.omm,
              args.group
            )
        }
      );

    } catch {
      rejected += 1;
    }
  }

  const records =
    Array.from(
      imported.values()
    );

  if (records.length === 0) {
    throw new Error(
      "No valid OMM records were found. Cache was not written."
    );
  }

  await writeDiskCache(records);

  console.log(
    `[OrbitWatch] imported ${records.length} OMM records into the persistent cache`
  );

  if (rejected > 0) {
    console.warn(
      `[OrbitWatch] skipped ${rejected} invalid records`
    );
  }
}

main().catch((error) => {
  console.error(
    `[OrbitWatch] import-cache failed: ${error.message}`
  );
  process.exitCode = 1;
});
