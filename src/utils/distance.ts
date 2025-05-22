
/**
 * Calculates the distance between two geographic coordinates using the Haversine formula
 * @param lon1 Longitude of the first point
 * @param lat1 Latitude of the first point
 * @param lon2 Longitude of the second point
 * @param lat2 Latitude of the second point
 * @returns Distance in kilometers
 */
export const calculateDistance = (lon1: number, lat1: number, lon2: number, lat2: number): number => {
  const R = 6371; // Earth radius in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

/**
 * Converts degrees to radians
 * @param deg Angle in degrees
 * @returns Angle in radians
 */
export const deg2rad = (deg: number): number => {
  return deg * (Math.PI/180);
};

/**
 * Calculates the midpoint between two geographic coordinates
 * @param lon1 Longitude of the first point
 * @param lat1 Latitude of the first point
 * @param lon2 Longitude of the second point
 * @param lat2 Latitude of the second point
 * @returns Midpoint coordinates [longitude, latitude]
 */
export const calculateMidpoint = (lon1: number, lat1: number, lon2: number, lat2: number): [number, number] => {
  const dLon = deg2rad(lon2 - lon1);
  
  const Bx = Math.cos(deg2rad(lat2)) * Math.cos(dLon);
  const By = Math.cos(deg2rad(lat2)) * Math.sin(dLon);
  
  const lat3 = Math.atan2(
    Math.sin(deg2rad(lat1)) + Math.sin(deg2rad(lat2)),
    Math.sqrt((Math.cos(deg2rad(lat1)) + Bx) * (Math.cos(deg2rad(lat1)) + Bx) + By * By)
  );
  
  const lon3 = deg2rad(lon1) + Math.atan2(By, Math.cos(deg2rad(lat1)) + Bx);
  
  return [rad2deg(lon3), rad2deg(lat3)];
};

/**
 * Converts radians to degrees
 * @param rad Angle in radians
 * @returns Angle in degrees
 */
export const rad2deg = (rad: number): number => {
  return rad * (180/Math.PI);
};

/**
 * Calculates the total distance for a sequence of places.
 * @param places An array of places, each with x (longitude) and y (latitude) properties.
 * @returns Total distance in kilometers.
 */
export const calculateTotalDistance = (places: { x: number; y: number }[]): number => {
  let totalDistance = 0;
  if (places.length < 2) {
    return 0;
  }

  for (let i = 0; i < places.length - 1; i++) {
    const place1 = places[i];
    const place2 = places[i + 1];
    // Ensure place1 and place2, and their coordinates are valid
    if (place1 && place2 && typeof place1.x === 'number' && typeof place1.y === 'number' && typeof place2.x === 'number' && typeof place2.y === 'number') {
      totalDistance += calculateDistance(place1.x, place1.y, place2.x, place2.y);
    } else {
      console.warn('[calculateTotalDistance] Invalid place data encountered:', place1, place2);
    }
  }
  return Math.round(totalDistance * 10) / 10; // Round to 1 decimal place
};
