
import { MutableRefObject } from 'react';

export interface GeoJsonProps { // General props for GeoJSON display, might be used by GeoJsonLayer if no specific props
  dataUrl?: string;
  center?: [number, number];
  zoom?: number;
  style?: React.CSSProperties;
}

export interface NodeProperties {
  NODE_ID: string;
  SERVICE_ID: string;
  NAME: string;
  TURN_P: string;
  DATE: string;
  REMARK: string;
  FID: number;
}

export interface LinkProperties {
  LINK_ID: string;
  F_NODE: string;
  T_NODE: string;
  LANES: number;
  ROAD_RANK: string;
  ROAD_TYPE: string;
  ROAD_NO: number;
  ROAD_NAME: string;
  ROAD_USE: string;
  MULTI_LINK: string;
  CONNECT: string;
  MAX_SPD: number;
  REST_VEH: string;
  REST_W: number;
  REST_H: number;
  LENGTH: number;
  FID: number;
  REMARK: string;
  DATETIME: string;
  TURN_TYPE?: string;
}

export type GeoCoordinates = [number, number]; // [longitude, latitude]

export interface GeoJsonPointGeometry {
  type: 'Point';
  coordinates: GeoCoordinates;
}

export interface GeoJsonLineStringGeometry {
  type: 'LineString';
  coordinates: GeoCoordinates[];
}

export type GeoJsonGeometry = GeoJsonPointGeometry | GeoJsonLineStringGeometry | GeoJsonFeature['geometry'];


export interface GeoJsonFeature {
  type: 'Feature';
  properties: NodeProperties | LinkProperties | any;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: any; // Was number[][], making it more general for now
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeoNode {
  id: string;
  type: 'node';
  geometry: GeoJsonPointGeometry;
  properties: NodeProperties;
  coordinates: GeoCoordinates;
  adjacentLinks: string[];
  adjacentNodes: string[];
  naverMarker?: any;
  setStyles?: (styles: any) => void;
}

export interface GeoLink {
  id: string;
  type: 'link';
  geometry: GeoJsonLineStringGeometry;
  properties: LinkProperties;
  coordinates: GeoCoordinates[];
  fromNode: string;
  toNode: string;
  length: number;
  naverPolyline?: any;
  setStyles?: (styles: any) => void;
}

export interface RouteStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string;
  zIndex?: number;
}

export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  renderAllNetwork: (style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
}

// Props for the GeoJsonLayer component itself
export interface GeoJsonLayerComponentProps { // Renamed to avoid conflict if GeoJsonLayerProps was a typo for GeoJsonProps
  map: any; // Naver Map instance
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded: (nodes: GeoNode[], links: GeoLink[]) => void;
}


export interface UseGeoJsonStateProps {
  url: string;
  onDataLoaded?: (data: GeoJsonFeatureCollection) => void;
}

export interface UseGeoJsonStateReturn {
  geoJsonLayer: MutableRefObject<GeoJsonLayerRef | null>; // Allow null initially
  loadGeoJson: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string | null; // Allow null
  setDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
}
