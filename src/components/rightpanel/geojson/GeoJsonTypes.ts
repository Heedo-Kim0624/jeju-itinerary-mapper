
// Type definitions for GeoJSON rendering components
import { GeoNode as OriginalGeoNode, GeoLink as OriginalGeoLink } from './GeoJsonTypes'; // Self-import for type alias if needed, or adjust if structure changes

export interface GeoNode {
  id: string;
  coordinates: [number, number]; // [longitude, latitude]
  naverMarker?: any; // Reference to naver.maps.Marker instance
  // For GeoJsonLoader, if properties are needed directly on GeoNode:
  properties?: any; // Or specific GeoJsonNodeProperties if defined
  adjacentLinks?: string[];
  adjacentNodes?: string[];
  setStyles?: (styles: any) => void;
}

export interface GeoLink {
  id: string;
  coordinates: [number, number][]; // Array of [longitude, latitude] pairs
  naverPolyline?: any; // Reference to naver.maps.Polyline instance
  // For GeoJsonLoader, if properties are needed directly on GeoLink:
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
  renderAllNetwork: (style?: RouteStyle) => any[];
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

// Removing the commented-out interfaces that were causing import errors
