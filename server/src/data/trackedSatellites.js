// Known, stable objects we always want in the catalog (looked up individually
// by NORAD catalog number), plus metadata used to label them nicely.
// Bulk constellations (Starlink, OneWeb) are pulled separately in tleCache.js.
export const NAMED_SATELLITES = [
  { catalogNumber: 25544, type: "Space station", operator: "International partnership", category: "station" },
  { catalogNumber: 48274, type: "Space station", operator: "CMSA", category: "station" },
  { catalogNumber: 20580, type: "Observatory", operator: "NASA / ESA", category: "science" },
  { catalogNumber: 43013, type: "Weather", operator: "NOAA / NASA", category: "weather" },
  { catalogNumber: 54234, type: "Weather", operator: "NOAA / NASA", category: "weather" },
  { catalogNumber: 25994, type: "Earth observation", operator: "NASA", category: "science" },
  { catalogNumber: 27424, type: "Earth observation", operator: "NASA", category: "science" },
  { catalogNumber: 49260, type: "Earth observation", operator: "USGS / NASA", category: "science" },
  { catalogNumber: 39084, type: "Earth observation", operator: "USGS / NASA", category: "science" }
];

// Bulk CelesTrak groups to pull from, and how many objects to sample from
// each (the big constellations have thousands of members — we only want a
// representative handful so the sky doesn't turn into soup).
export const GROUP_SOURCES = [
  { group: "stations", limit: 10, category: "station" },
  { group: "weather", limit: 8, category: "weather" },
  { group: "starlink", limit: 12, category: "communication" },
  { group: "oneweb", limit: 6, category: "communication" }
];

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
    default:
      return "other";
  }
}
