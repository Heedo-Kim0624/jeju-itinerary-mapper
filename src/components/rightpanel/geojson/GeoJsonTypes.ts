
// Type definitions for GeoJSON rendering components

export interface GeoNode {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  naverMarker?: any; // Reference to naver.maps.Marker instance
}

export interface GeoLink {
  id: string;
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  naverPolyline?: any; // Reference to naver.maps.Polyline instance
}

export interface RouteStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string; // For node markers
  zIndex?: number;
}

// Interface for the global GeoJSON layer reference
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  renderAllNetwork: (style?: RouteStyle) => any[]; // Add renderAllNetwork to the interface
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
}

// Extend the Window interface to include our global GeoJSON layer
declare global {
  interface Window {
    geoJsonLayer: GeoJsonLayerRef;
  }
}
