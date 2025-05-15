export interface GeoNode {
  id: string;
  type: 'node';
  coordinates: [number, number]; // [lng, lat]
  properties?: Record<string, any>;
  naverMarker?: any; // Naver Maps Marker instance
}

export interface GeoLink {
  id: string;
  type: 'link';
  source: string; // source node id
  target: string; // target node id
  coordinates: [number, number][]; // Array of [lng, lat]
  properties?: Record<string, any>;
  naverPolyline?: any; // Naver Maps Polyline instance
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


// 전역 GeoJSON 레이어 인터페이스
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: RouteStyle) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => GeoNode | undefined;
  getLinkById: (id: string) => GeoLink | undefined;
  // 모든 노드와 링크를 표시하는 함수 추가 (선택적)
  renderAllFeatures?: (style?: RouteStyle) => void; 
}

// 전역 window 객체에 타입 선언 (Naver Maps API와 GeoJSON 레이어)
declare global {
  interface Window {
    // navermaps 관련 타입은 src/types/navermaps.d.ts 등 별도 파일에서 관리하는 것이 좋음
    // 여기서는 naver 관련 타입 선언을 제거하여 loadNaverMaps.ts와의 충돌을 피함.
    // naver: any; // 이 줄을 주석 처리하거나 삭제

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
