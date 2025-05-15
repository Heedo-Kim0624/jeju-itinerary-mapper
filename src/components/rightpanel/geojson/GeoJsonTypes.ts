import * as React from "react";
import { Place } from '@/types/supabase'; // Assuming Place might be used in properties

export type GeoCoordinates = [number, number]; // longitude, latitude

export interface GeoJsonGeometry {
  type: string; // "Point", "LineString", "Polygon", etc.
  coordinates: GeoCoordinates | GeoCoordinates[] | GeoCoordinates[][];
}

export interface FeatureProperties {
  id: string | number; // Allow number for ID as well
  name?: string; // name can be optional
  [key: string]: any;
}

export interface GeoJsonFeature {
  type: "Feature";
  geometry: GeoJsonGeometry;
  properties: FeatureProperties;
}

export interface GeoJsonCollection {
  type: "FeatureCollection";
  features: GeoJsonFeature[];
}

// Specific properties for Nodes and Links from your existing types
export interface NodeProperties extends FeatureProperties {
  NODE_ID: string; // Ensure these match the actual GeoJSON properties
  NAME?: string;
  CATEGORY?: string;
  ADDRESS?: string;
  // ... other properties from your NODE_JSON.geojson
}

export interface LinkProperties extends FeatureProperties {
  LINK_ID: string; // Ensure these match the actual GeoJSON properties
  F_NODE: string;
  T_NODE: string;
  LENGTH?: number;
  // ... other properties from your LINK_JSON.geojson
}

export interface GeoNode {
  id: string;
  type: 'node';
  coordinates: GeoCoordinates;
  properties: NodeProperties;
  adjacentLinks: string[];
  adjacentNodes: string[];
  naverMarker?: any;
  // For place mapping
  originalPlaceData?: Place; // Optional: if this GeoNode represents a specific Place
  geoNodeId?: string; 
  geoNodeDistance?: number;
}

export interface GeoLink {
  id: string;
  type: 'link';
  coordinates: GeoCoordinates[];
  properties: LinkProperties;
  fromNode: string;
  toNode: string;
  length: number;
  naverPolyline?: any;
}

export interface GeoJsonNodeFeature extends GeoJsonFeature {
  properties: NodeProperties;
  geometry: {
    type: "Point";
    coordinates: GeoCoordinates;
  };
}

export interface GeoJsonLinkFeature extends GeoJsonFeature {
  properties: LinkProperties;
  geometry: {
    type: "LineString";
    coordinates: GeoCoordinates[];
  };
}

export interface GeoJsonNodeCollection extends GeoJsonCollection {
  features: GeoJsonNodeFeature[];
}

export interface GeoJsonLinkCollection extends GeoJsonCollection {
  features: GeoJsonLinkFeature[];
}

export interface RouteStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string; // For nodes/markers
  zIndex?: number;
}

export interface GeoJsonLoaderProps {
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onLoadSuccess: (nodes: GeoNode[], links: GeoLink[]) => void;
  onLoadError: (error: Error) => void;
}

export interface GeoJsonRendererProps {
  map: any; // Naver Map instance
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange?: (markers: any[], polylines: any[]) => void;
}

export interface GeoJsonLayerProps {
  map: any; // Naver Map instance
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void; // Callback when GeoJSON is loaded
}

export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
  renderAllFeatures?: (style?: RouteStyle) => void; // Make sure this is optional if not always present
}

// Fix for TS2717 regarding window.geoJsonLayer
declare global {
  interface Window {
    geoJsonLayer?: GeoJsonLayerRef; // Use GeoJsonLayerRef consistently
    naver?: any; // For Naver Maps API
  }
}

export interface MapContext {
  map: any;
  mapContainer: React.RefObject<HTMLDivElement>;
  initializeMap: () => Promise<void>;
  isMapInitialized: boolean;
  setIsMapInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  addMarker: (options: any) => any; // Consider defining a more specific marker options type
  removeMarker: (marker: any) => void;
  panTo: (coordinates: { lat: number; lng: number } | [number, number], zoom?: number) => void;
  removeAllMarkers: () => void;
  centerMapToMarkers: () => void;
  renderRouteOnMap: (coordinates: [number, number][]) => void;
  clearRoute: () => void;
  geoJsonLayer: GeoJsonLayerRef; // Should match the global declaration and useGeoJsonState
}
