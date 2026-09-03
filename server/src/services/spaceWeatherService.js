const KP_URL = "https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json";
const SOLAR_WIND_URL = "https://services.swpc.noaa.gov/products/summary/solar-wind-speed.json";
const FLUX_URL = "https://services.swpc.noaa.gov/json/f107_cm_flux.json";

const TTL_MS = 15 * 60 * 1000;
let cache = { builtAt: 0, data: null };

function kpDescriptor(kp) {
  if (kp < 3) return "Quiet";
  if (kp < 4) return "Unsettled";
  if (kp < 5) return "Active";
  if (kp < 6) return "Minor storm";
  if (kp < 7) return "Moderate storm";
  return "Strong storm";
}

async function fetchJson(url) {
  const response = await fetch(url, { headers: { "User-Agent": "OrbitWatch/0.1 (educational project)" } });
  if (!response.ok) throw new Error(`${url} responded ${response.status}`);
  return response.json();
}

async function buildSummary() {
  const [kpRows, windSummary, fluxRows] = await Promise.allSettled([
    fetchJson(KP_URL),
    fetchJson(SOLAR_WIND_URL),
    fetchJson(FLUX_URL)
  ]);

  let kpValue = null;
  if (kpRows.status === "fulfilled" && Array.isArray(kpRows.value) && kpRows.value.length > 1) {
    const lastRow = kpRows.value[kpRows.value.length - 1];
    kpValue = Number(lastRow[1]);
  }

  let windSpeed = null;
  if (windSummary.status === "fulfilled" && windSummary.value) {
    windSpeed = Number(windSummary.value.WindSpeed ?? windSummary.value.wind_speed);
  }

  let flux = null;
  if (fluxRows.status === "fulfilled" && Array.isArray(fluxRows.value) && fluxRows.value.length > 0) {
    const lastRow = fluxRows.value[fluxRows.value.length - 1];
    flux = Number(lastRow.flux);
  }

  return {
    kIndex: Number.isFinite(kpValue) ? kpValue : null,
    kIndexLabel: Number.isFinite(kpValue) ? kpDescriptor(kpValue) : "Unavailable",
    solarWindKmS: Number.isFinite(windSpeed) ? Math.round(windSpeed) : null,
    solarFlux: Number.isFinite(flux) ? Math.round(flux) : null,
    updatedAt: new Date().toISOString(),
    source: "NOAA Space Weather Prediction Center"
  };
}

export async function getSpaceWeather({ forceRefresh = false } = {}) {
  const isStale = Date.now() - cache.builtAt > TTL_MS;
  if (forceRefresh || isStale || !cache.data) {
    try {
      cache = { builtAt: Date.now(), data: await buildSummary() };
    } catch (error) {
      if (!cache.data) throw error;
      console.warn("Space weather refresh failed, serving stale cache:", error.message);
    }
  }
  return cache.data;
}
