
// This declaration is important for TypeScript to recognize global augmentations.
export {};

declare global {
  interface Window {
    naver: any; // Consider a more specific type if available for Naver Maps API
    geoJsonLayer?: import('@/components/rightpanel/geojson/GeoJsonTypes').GeoJsonLayerRef;
  }
}
