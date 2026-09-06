export const NAMED_SATELLITES = [
  {
    catalogNumber: 25544,
    type: "Space station",
    operator: "International partnership",
    category: "station"
  },

  {
    catalogNumber: 48274,
    type: "Space station",
    operator: "CMSA",
    category: "station"
  },

  // =========================================================
  // SCIENCE / EARTH OBSERVATION
  // =========================================================

  {
    catalogNumber: 20580,
    type: "Space telescope",
    operator: "NASA / ESA",
    category: "science"
  },

  {
    catalogNumber: 25994,
    type: "Earth observation",
    operator: "NASA",
    category: "science"
  },

  {
    catalogNumber: 27424,
    type: "Earth observation",
    operator: "NASA",
    category: "science"
  },

  {
    catalogNumber: 49260,
    type: "Earth observation",
    operator: "USGS / NASA",
    category: "science"
  },

  // =========================================================
  // 🇮🇳 INDIA
  // =========================================================
  // These are intentionally pinned so OrbitWatch can later
  // provide a dedicated India Mode.

  {
    catalogNumber: 54361,
    type: "Earth observation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "EOS-06 / Oceansat-3"
  },

  {
    catalogNumber: 51656,
    type: "Earth observation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "EOS-04 / RISAT-1A"
  },

  {
    catalogNumber: 44804,
    type: "Earth observation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "Cartosat-3"
  },

  {
    catalogNumber: 42767,
    type: "Earth observation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "Cartosat-2E"
  },

  {
    catalogNumber: 41877,
    type: "Earth observation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "Resourcesat-2A"
  },

  {
    catalogNumber: 58990,
    type: "Weather",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "INSAT-3DS"
  },

  {
    catalogNumber: 52903,
    type: "Communications",
    operator: "NSIL / ISRO",
    category: "india",
    country: "India",
    mission: "GSAT-24 / CMS-02"
  },

  {
    catalogNumber: 62028,
    type: "Communications",
    operator: "NSIL / ISRO",
    category: "india",
    country: "India",
    mission: "GSAT-20 / GSAT-N2"
  },

  {
    catalogNumber: 56759,
    type: "Navigation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "NVS-01 / IRNSS-1J"
  },

  {
    catalogNumber: 43286,
    type: "Navigation",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "IRNSS-1I"
  },

  {
    catalogNumber: 42747,
    type: "Communications",
    operator: "ISRO",
    category: "india",
    country: "India",
    mission: "GSAT-19"
  },

  // =========================================================
  // WEATHER
  // =========================================================

  {
    catalogNumber: 43013,
    type: "Weather",
    operator: "NOAA / NASA",
    category: "weather"
  },

  {
    catalogNumber: 54234,
    type: "Weather",
    operator: "NOAA / NASA",
    category: "weather"
  }
];


// =========================================================
// CELestrak groups
// =========================================================
//
// We deliberately DO NOT download every giant constellation
// separately. CelesTrak's Active group already contains the
// active catalog and Starlink is a subset of it.
//
// The "limit" here is how many objects OrbitWatch initially
// uses for live propagation. Later the full catalog will power
// the Satellite Explorer.

export const GROUP_SOURCES = [
  // Human spaceflight / stations
  {
    group: "stations",
    limit: 30,
    category: "station"
  },

  // Weather satellites
  {
    group: "weather",
    limit: 70,
    category: "weather"
  },

  // Earth observation / science
  {
    group: "resource",
    limit: 110,
    category: "science"
  },

  // Large modern constellations
  {
    group: "starlink",
    limit: 180,
    category: "communication"
  },

  {
    group: "oneweb",
    limit: 80,
    category: "communication"
  }
];


// =========================================================
// UI COLOR CATEGORY
// =========================================================

export function categoryColor(category) {
  switch (category) {
    case "station":
      return "station";

    case "science":
      return "science";

    case "weather":
      return "weather";

    case "communication":
      return "comms";

    case "navigation":
      return "science";

    case "india":
      return "india";

    default:
      return "other";
  }
}