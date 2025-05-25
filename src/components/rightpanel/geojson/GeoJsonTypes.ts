
// GeoJSON 노드/링크 타입 정의
export interface GeoCoordinates {
  0: number; // 경도 (longitude)
  1: number; // 위도 (latitude)
}

export interface GeoJsonGeometry {
  type: 'Point' | 'LineString' | 'Polygon' | 'MultiPoint' | 'MultiLineString' | 'MultiPolygon' | string; // 구체적인 타입 명시
  coordinates: GeoCoordinates | GeoCoordinates[] | GeoCoordinates[][];
}

export interface GeoJsonNodeProperties {
  NODE_ID: number;
  NODE_TYPE: string;
  NODE_NAME: string;
  [key: string]: any;
}

export interface GeoJsonLinkProperties {
  LINK_ID: number;
  F_NODE: number;
  T_NODE: number;
  LENGTH: number;
  [key: string]: any;
}

// 기본 GeoJsonFeature 구조
interface BaseGeoJsonFeature<P, G extends GeoJsonGeometry> {
  type: 'Feature';
  properties: P;
  geometry: G;
  id?: string | number;
}

// 노드를 위한 GeoJsonFeature
export type GeoJsonNodeFeature = BaseGeoJsonFeature<GeoJsonNodeProperties, GeoJsonGeometry & { type: 'Point' | string }>; // 노드는 보통 Point

// 링크를 위한 GeoJsonFeature
export type GeoJsonLinkFeature = BaseGeoJsonFeature<GeoJsonLinkProperties, GeoJsonGeometry & { type: 'LineString' | string }>; // 링크는 보통 LineString

// GeoJsonFeature 유니언 타입
export type GeoJsonFeature = GeoJsonNodeFeature | GeoJsonLinkFeature;

// 타입 가드 함수
export function isGeoJsonNodeProperties(props: any): props is GeoJsonNodeProperties {
  return props && typeof props.NODE_ID === 'number';
}

export function isGeoJsonLinkProperties(props: any): props is GeoJsonLinkProperties {
  return props && typeof props.LINK_ID === 'number';
}

export function isGeoJsonNodeFeature(feature: GeoJsonFeature): feature is GeoJsonNodeFeature {
  return isGeoJsonNodeProperties(feature.properties);
}

export function isGeoJsonLinkFeature(feature: GeoJsonFeature): feature is GeoJsonLinkFeature {
  return isGeoJsonLinkProperties(feature.properties);
}

export interface GeoJsonCollection {
  type: 'FeatureCollection'; // FeatureCollection으로 명시
  features: GeoJsonFeature[];
}

// 노드와 링크를 위한 기본 타입 정의
export interface GeoNode {
  id: string;
  type: 'node';
  geometry: GeoJsonGeometry; // GeoJsonGeometry로 유지, 실제 사용시 Point로 캐스팅 가능
  properties: GeoJsonNodeProperties;
  coordinates: GeoCoordinates; // geometry.coordinates[0], geometry.coordinates[1]과 중복될 수 있으나, 편의성을 위해 유지
  adjacentLinks: string[];
  adjacentNodes: string[];
  naverMarker?: any;
  setStyles: (styles: RouteStyle) => void;
}

export interface GeoLink {
  id: string;
  type: 'link';
  geometry: GeoJsonGeometry; // GeoJsonGeometry로 유지, 실제 사용시 LineString으로 캐스팅 가능
  properties: GeoJsonLinkProperties;
  coordinates: GeoCoordinates[]; // geometry.coordinates와 중복될 수 있으나, 편의성을 위해 유지
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

// GeoJson 레이어 참조를 위한 타입
export interface GeoJsonLayerRef {
  renderRoute: (nodeIds: string[], linkIds: string[], style?: any) => any[];
  clearDisplayedFeatures: () => void;
  getNodeById: (id: string) => any;
  getLinkById: (id: string) => any;
  isLoaded: () => boolean; // isLoaded 속성 추가
}

// GeoJSON 레이어 속성
export interface GeoJsonLayerProps {
  map: any;
  visible: boolean;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
  onGeoJsonLoaded?: (nodes: GeoNode[], links: GeoLink[]) => void;
}
