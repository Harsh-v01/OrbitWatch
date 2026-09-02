/**
 * Future API boundary.
 * Keep provider keys and orbital-provider requests on the server.
 */
export async function getSatellitesAbove({ latitude, longitude }) {
  const params = new URLSearchParams({
    lat: latitude,
    lng: longitude
  });

  const response = await fetch(`/api/satellites/above?${params}`);

  if (!response.ok) {
    throw new Error("Unable to load satellite data");
  }

  return response.json();
}