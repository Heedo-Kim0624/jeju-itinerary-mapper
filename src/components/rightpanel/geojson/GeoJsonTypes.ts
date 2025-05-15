
// Type definitions for GeoJSON rendering components

export interface GeoNode {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  naverMarker?: any; // Reference to naver.maps.Marker instance
  properties?: any; // Or specific GeoJsonNodeProperties if defined
  adjacentLinks?: string[];
  adjacentNodes?: string[];
  setStyles?: (styles: any) => void;
}

export interface GeoLink {
  id: string;
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  naverPolyline?: any; // Reference to naver.maps.Polyline instance
  properties?: any; // Or specific GeoJsonLinkProperties if defined
  fromNode?: string;
  toNode?: string;
  length?: number;
  setStyles?: (styles: any) => void;
}

export interface RouteStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string; // For node markers
  zIndex?: number;
}

// Interface for the GeoJsonLayer component props
export interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void;
}

// Interface for the global GeoJSON layer reference
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  renderAllNetwork: (style?: RouteStyle) => any[]; // Method to render the entire network
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
}

// Removing the duplicate global declaration since it's now in vite-env.d.ts
// The window.geoJsonLayer declaration is now unified in vite-env.d.ts
