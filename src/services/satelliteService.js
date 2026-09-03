async function request(path) {
  const response = await fetch(path);
  const body =
    await response
      .json()
      .catch(() => ({}));

  if (!response.ok) {
    const error =
      new Error(
        body.message ||
        body.error ||
        `Request failed (${response.status})`
      );

    error.status =
      response.status;
    error.body =
      body;

    throw error;
  }

  return body;
}

export async function getSatellitesAbove({ lat, lng, alt = 0 }) {
  const params = new URLSearchParams({ lat, lng, alt });
  return request(`/api/satellites/above?${params}`);
}

export async function getSatellitePasses(catalogNumber, { lat, lng, alt = 0, hours = 48 }) {
  const params = new URLSearchParams({ lat, lng, alt, hours });
  return request(`/api/satellites/${catalogNumber}/passes?${params}`);
}

export async function getUpcomingPasses({ lat, lng, alt = 0, hours = 8, limit = 12 }) {
  const params = new URLSearchParams({ lat, lng, alt, hours, limit });
  return request(`/api/satellites/passes/next?${params}`);
}

export async function getSpaceWeather() {
  return request(`/api/space-weather`);
}
