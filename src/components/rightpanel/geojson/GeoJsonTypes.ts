
// GeoJSON 노드/링크 타입 정의
export interface GeoCoordinates {
  0: number; // 경도 (longitude)
  1: number; // 위도 (latitude)
}

export interface GeoJsonGeometry {
  type: string;
  coordinates: GeoCoordinates | GeoCoordinates[] | GeoCoordinates[][];
}

export interface NodeProperties {
  NODE_ID: number;
  NODE_TYPE: string;
  NODE_NAME: string;
  [key: string]: any;
}

export interface LinkProperties {
  LINK_ID: number;
  F_NODE: number;
  T_NODE: number;
  LENGTH: number;
  [key: string]: any;
}

export interface GeoJsonFeature {
  type: "Feature"; // "Feature"로 고정
  properties: NodeProperties | LinkProperties;
  geometry: GeoJsonGeometry;
}


export interface GeoJsonCollection {
  type: "FeatureCollection"; // "FeatureCollection"으로 고정
  features: GeoJsonFeature[];
}

// 노드와 링크를 위한 기본 타입 정의
export interface GeoNode {
  id: string;
  type: 'node';
  geometry: GeoJsonGeometry;
  properties: NodeProperties;
  coordinates: GeoCoordinates;
  adjacentLinks: string[];
  adjacentNodes: string[];
  naverMarker?: any;
  setStyles: (styles: RouteStyle) => void;
}

export interface GeoLink {
  id: string;
  type: 'link';
  geometry: GeoJsonGeometry;
  properties: LinkProperties;
  coordinates: GeoCoordinates[];
  fromNode: string;
  toNode: string;
  length: number;
  naverPolyline?: any;
  setStyles: (styles: RouteStyle) => void;
}

// 특정 노드나 링크에 적용할 스타일
export interface RouteStyle {
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  fillColor?: string;
  fillOpacity?: number;
  zIndex?: number;
}

// 렌더러 컴포넌트 Props
export interface NodeRendererProps {
  map: any;
  visible: boolean;
  nodes: GeoNode[];
  style: RouteStyle;
  onMarkersCreated: (markers: any[]) => void;
}

export interface LinkRendererProps {
  map: any;
  visible: boolean; 
  links: GeoLink[];
  style: RouteStyle;
  onPolylinesCreated: (polylines: any[]) => void;
}

export interface GeoJsonRendererProps {
  map: any;
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange?: (markers: any[], polylines: any[]) => void;
}

// GeoJson 레이어 참조를 위한 타입
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
  renderAllNetwork?: () => any[]; // renderAllNetwork 함수 추가
}

// GeoJSON 레이어 속성
export interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void;
}

// GeoJSON 로더 속성
export interface GeoJsonLoaderProps {
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onLoadSuccess: (nodes: GeoNode[], links: GeoLink[]) => void;
  onLoadError: (error: Error) => void;
}

// 서버 경로 응답 타입
export interface ServerRouteResponse {
  status: string;
  message: string;
  nodeIds?: string[];
  linkIds?: string[];
  data?: any;
}

// 글로벌 네임스페이스 선언
declare global {
  interface Window {
    geoJsonLayer?: GeoJsonLayerRef; // 타입을 GeoJsonLayerRef로 명시하고 optional로 변경
    naver?: any;
  }
}
