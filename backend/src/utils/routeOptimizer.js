/**
 * Route optimizer utility — simulates GeoAI route computation.
 * In production, integrate with Google Maps Directions API or OSRM.
 */

/**
 * Generate a simulated route between two coordinates.
 * Returns an array of [lng, lat] waypoints.
 */
function computeRoute(originCoords, destinationCoords) {
  const [oLng, oLat] = originCoords;
  const [dLng, dLat] = destinationCoords;

  // Interpolate 8 waypoints between origin and destination
  const steps = 8;
  const route = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Add slight curve variation
    const jitter = (Math.random() - 0.5) * 0.05;
    route.push([
      parseFloat((oLng + (dLng - oLng) * t + jitter).toFixed(5)),
      parseFloat((oLat + (dLat - oLat) * t + jitter).toFixed(5)),
    ]);
  }
  return route;
}

/**
 * Calculate straight-line distance between two [lng, lat] points in km.
 */
function haversineDistance([lng1, lat1], [lng2, lat2]) {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Estimate ETA given distance in km and average speed in km/h.
 */
function estimateETA(distanceKm, avgSpeedKmh = 40) {
  const hours = distanceKm / avgSpeedKmh;
  return new Date(Date.now() + hours * 3600 * 1000);
}

/**
 * Check if current location deviates from planned route by more than thresholdKm.
 */
function checkDeviation(currentCoords, plannedRoute, thresholdKm = 5) {
  if (!plannedRoute || plannedRoute.length === 0) return { deviated: false, minDistKm: 0 };

  let minDist = Infinity;
  for (const point of plannedRoute) {
    const d = haversineDistance(currentCoords, point);
    if (d < minDist) minDist = d;
  }

  return { deviated: minDist > thresholdKm, minDistKm: parseFloat(minDist.toFixed(2)) };
}

module.exports = { computeRoute, haversineDistance, estimateETA, checkDeviation };
