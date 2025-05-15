
// GeoJSON 데이터와 관련된 타입 정의

// 노드 특성 인터페이스
export interface GeoJsonNodeProperties {
  NODE_ID?: string;
  [key: string]: any;
}

// 링크 특성 인터페이스
export interface GeoJsonLinkProperties {
  LINK_ID?: string;
  [key: string]: any;
}

// GeoJSON 좌표 타입
export type GeoCoordinates = [number, number] | number[];

// GeoJSON 지오메트리 인터페이스
export interface GeoJsonGeometry {
  type: string;
  coordinates: GeoCoordinates | GeoCoordinates[] | GeoCoordinates[][];
}

// GeoJSON 피처 인터페이스
export interface GeoJsonFeature {
  type: string;
  geometry: GeoJsonGeometry;
  properties: GeoJsonNodeProperties | GeoJsonLinkProperties;
  id?: string;
}

// GeoJSON 컬렉션 인터페이스
export interface GeoJsonCollection {
  type: string;
  features: GeoJsonFeature[];
}

// 노드 객체 인터페이스
export interface GeoNode {
  id: string;
  type: 'node';
  geometry: GeoJsonGeometry;
  properties: GeoJsonNodeProperties;
  coordinates: GeoCoordinates;
  map?: any;
  styles?: any;
  naverElement?: any;
  getId: () => string;
  getGeometryAt: () => { getCoordinates: () => { x: number, y: number } };
  clone: () => GeoNode;
  setMap: (map: any) => void;
  setStyles: (styles: any) => void;
}

// 링크 객체 인터페이스
export interface GeoLink {
  id: string;
  type: 'link';
  geometry: GeoJsonGeometry;
  properties: GeoJsonLinkProperties;
  coordinates: GeoCoordinates[];
  map?: any;
  styles?: any;
  naverElement?: any;
  getId: () => string;
  clone: () => GeoLink;
  setMap: (map: any) => void;
  setStyles: (styles: any) => void;
}

// 노드와 링크 ID 추출 데이터 인터페이스
export interface ExtractedRouteIds {
  nodeIds: string[];
  linkIds: string[];
}

// 경로 스타일 인터페이스
export interface RouteStyle {
  strokeColor: string;
  strokeWeight: number;
  strokeOpacity: number;
  zIndex?: number;
  clickable?: boolean;
  [key: string]: any;
}

// GeoJsonLayer 속성 인터페이스
export interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void;
}

// 전역 GeoJsonLayer 참조 인터페이스
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
}

// Window 인터페이스 확장
declare global {
  interface Window {
    geoJsonLayer?: GeoJsonLayerRef;
    naver?: any;
  }
}
