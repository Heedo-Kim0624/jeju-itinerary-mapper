
/**
 * Helper function to extract values from objects regardless of field case
 */
export function normalizeField(obj: any, fieldNames: string[]): any {
  // Try exact matches first
  for (const field of fieldNames) {
    if (obj[field] !== undefined) return obj[field];
  }
  
  // Try case-insensitive match
  const lowerFieldNames = fieldNames.map(f => f.toLowerCase());
  for (const key of Object.keys(obj)) {
    const lowerKey = key.toLowerCase();
    const index = lowerFieldNames.findIndex(f => f === lowerKey);
    if (index >= 0) {
      return obj[key];
    }
  }
  
  return undefined;
}

export function normalizePlaceFields(place: any) {
  return {
    id: normalizeField(place, ['id', 'ID']),
    placeName: normalizeField(place, ['place_name', 'Place_Name']),
    roadAddress: normalizeField(place, ['road_address', 'Road_Address']),
    lotAddress: normalizeField(place, ['lot_address', 'Lot_Address']),
    longitude: parseFloat(String(normalizeField(place, ['longitude', 'Longitude']) || 0)),
    latitude: parseFloat(String(normalizeField(place, ['latitude', 'Latitude']) || 0))
  };
}
