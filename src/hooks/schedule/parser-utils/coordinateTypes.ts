
// Helper interface for GeoJSON nodes expected from MapContext
export interface MapContextGeoNode {
  id: string; // This should be the NODE_ID
  coordinates: [number, number]; // [longitude, latitude]
}
