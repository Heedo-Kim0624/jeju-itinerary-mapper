
export interface GeoNode {
  id: string;
  type: 'node';
  coordinates: [number, number]; // [lng, lat]
  properties?: Record<string, any>;
  naverMarker?: any; // Naver Maps Marker instance
  adjacentLinks?: string[]; // 인접 링크 ID 배열
  adjacentNodes?: string[]; // 인접 노드 ID 배열
  setStyles?: (styles: any) => void; // 스타일 설정 함수
}

export interface GeoLink {
  id: string;
  type: 'link';
  source?: string; // source node id
  target?: string; // target node id
  fromNode?: string; // F_NODE
  toNode?: string; // T_NODE
  coordinates: [number, number][]; // Array of [lng, lat]
  properties?: Record<string, any>;
  naverPolyline?: any; // Naver Maps Polyline instance
  length?: number; // 링크 길이
  setStyles?: (styles: any) => void; // 스타일 설정 함수
}

export interface RouteStyle {
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  fillColor?: string; // For nodes or markers
  zIndex?: number;
}

export type GeoJsonFeature = GeoNode | GeoLink;

export interface GeoJsonData {
  nodes: GeoNode[];
  links: GeoLink[];
}

// GeoJsonLoader.tsx에서 사용하는 타입 추가
export type GeoCoordinates = [number, number] | [number, number][];
export interface GeoJsonGeometry {
  type: string;
  coordinates: GeoCoordinates;
}
export interface GeoJsonNodeProperties {
  NODE_ID: string;
  [key: string]: any;
}
export interface GeoJsonLinkProperties {
  LINK_ID: string;
  F_NODE?: string;
  T_NODE?: string;
  LENGTH?: number;
  [key: string]: any;
}

// 전역 GeoJSON 레이어 인터페이스
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
  // 모든 노드와 링크를 표시하는 함수 추가
  renderAllFeatures: (style?: RouteStyle) => void; 
}

// 전역 window 객체에 타입 선언 (Naver Maps API와 GeoJSON 레이어)
declare global {
  interface Window {
    // window.naver는 loadNaverMaps.ts에서 관리
    geoJsonLayer?: GeoJsonLayerRef; // GeoJSON 레이어 객체
  }
}

// GeoJsonLoader 컴포넌트의 props 타입
export interface GeoJsonLoaderProps {
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onLoadSuccess: (nodes: GeoNode[], links: GeoLink[]) => void;
  onLoadError: (error: Error) => void;
}

// GeoJsonRenderer 컴포넌트의 props 타입
export interface GeoJsonRendererProps {
  map: any; // Naver Map instance
  visible: boolean;
  nodes: GeoNode[];
  links: GeoLink[];
  onDisplayedFeaturesChange?: (markers: any[], polylines: any[]) => void;
}

// GeoJsonLayer 메인 컴포넌트의 props 타입
export interface GeoJsonLayerProps {
  map: any; // Naver Map instance
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void;
}
