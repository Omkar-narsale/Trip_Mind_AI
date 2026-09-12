/**
 * Generates direct, clickable OpenStreetMap URLs for geographic coordinates.
 * Allows users to inspect verified locations for accommodations, attractions, restaurants, and transit points.
 */
export function getOpenStreetMapUrl(latitude, longitude) {
  if (latitude == null || longitude == null) return null;
  return `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`;
}
