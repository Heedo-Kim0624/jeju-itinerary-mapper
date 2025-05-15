
import { MutableRefObject } from 'react';

export interface GeoJsonProps {
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

export interface GeoJsonFeature {
  type: 'Feature';
  properties: NodeProperties | LinkProperties | any;
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon';
    coordinates: number[][];
  };
}

export interface GeoJsonFeatureCollection {
  type: 'FeatureCollection';
  features: GeoJsonFeature[];
}

export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
  renderAllNetwork: () => void;
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => any;
  getLinkById: (id: string) => any;
}

export interface UseGeoJsonStateProps {
  url: string;
  onDataLoaded?: (data: GeoJsonFeatureCollection) => void;
}

export interface UseGeoJsonStateReturn {
  geoJsonLayer: MutableRefObject<GeoJsonLayerRef>;
  loadGeoJson: (url: string) => Promise<void>;
  isLoading: boolean;
  error: string;
  setDataUrl: React.Dispatch<React.SetStateAction<string | null>>;
}
