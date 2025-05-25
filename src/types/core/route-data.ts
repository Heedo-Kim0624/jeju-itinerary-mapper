
/**
 * Types related to route data and segments
 */

// Route data interface (original)
export interface RouteData {
  nodeIds: string[];
  linkIds: string[];
  segmentRoutes?: OriginalSegmentRoute[]; // Renamed to avoid conflict
}

// Segment route interface (original)
export interface OriginalSegmentRoute {
  fromIndex: number;
  toIndex: number;
  nodeIds: string[];
  linkIds: string[];
}

// Server route response interface
export interface ServerRouteResponse {
  nodeIds: (string | number)[];
  linkIds: (string | number)[];
  interleaved_route?: (string | number)[];
}

// Parsed route data
export interface ParsedRouteData {
  day: number;
  segments: RouteSegmentForParsedData[];
  totalDistanceMeters: number;
}

// Route segment for parsed data
export interface RouteSegmentForParsedData {
  from: string;
  to: string;
  links: string[];
}

// Client-parsed route segment
export interface ParsedRoute {
  from: string | number;
  to: string | number;
  links: (string | number)[];
}

// Extracted route data
export interface ExtractedRouteData {
  nodeIds: string[];
  linkIds: string[];
}


// --- New types based on the guide ---

// 일자별 경로 데이터 구조
export interface DayRouteData {
  day: number;                   // 일차 (1, 2, 3, ...)
  nodeIds: string[];             // 노드(장소) ID 목록
  linkIds: string[];             // 링크(도로) ID 목록
  interleaved_route?: (string | number)[]; // 노드와 링크가 교차된 전체 경로
  totalDistance?: number;        // 총 이동 거리 (미터)
  segmentRoutes?: SegmentRoute[]; // 구간별 경로 정보
}

// 구간별 경로 정보
export interface SegmentRoute {
  from_node: string;             // 출발 노드 ID
  to_node: string;               // 도착 노드 ID
  links: string[];               // 구간에 포함된 링크 ID 목록
  distance: number;              // 구간 거리 (미터)
}

// GeoJSON 링크 데이터 구조
export interface GeoLink {
  type: "Feature"; // GeoJSON Feature type
  id?: string | number; // Optional GeoJSON feature ID
  properties: {
    LINK_ID: string;             // 링크 ID (GeoJSON 속성)
    ROAD_NAME?: string;          // 도로명
    ROAD_TYPE?: string;          // 도로 유형
    MAX_SPD?: number;            // 최대 속도
    [key: string]: any;          // 기타 속성
  };
  geometry: {
    type: "LineString";          // 지오메트리 유형 (LineString)
    coordinates: number[][];     // 좌표 배열 [[경도, 위도], ...]
  };
}

// GeoJSON 노드(Point Feature) 데이터 구조 추가
export interface GeoJsonNode {
  type: "Feature";
  id?: string | number;
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: Record<string, any>;
}

// 일자별 마커 데이터 구조
export interface DayMarkerData {
  day: number;                   // 일차 (1, 2, 3, ...)
  places: ItineraryPlace[];      // 해당 일자의 장소 목록
}

// 장소 정보 구조 (to replace/supercede ItineraryPlaceWithTime if possible)
export interface ItineraryPlace {
  id: string | number;           // 장소 ID
  name: string;                  // 장소명
  category: string;              // 카테고리
  time?: string;                 // 방문 시간대 (e.g., "Mon_1000" or specific time "10:00")
  timeBlock?: string;            // Optional: for compatibility if still needed from ItineraryPlaceWithTime
  x: number;                     // 경도
  y: number;                     // 위도
  address?: string;              // 주소
  road_address?: string;         // 도로명 주소 for compatibility
  description?: string;          // 설명 for compatibility
  image_url?: string;            // 이미지 URL for compatibility
  phone?: string;                // 전화번호 for compatibility
  rating?: number;               // 평점 for compatibility
  homepage?: string;             // 홈페이지 for compatibility
  geoNodeId?: string | number;   // GeoNode ID for compatibility
  isFallback?: boolean;          // 폴백 데이터 여부 for compatibility
  isSelected?: boolean;          // 선택 여부 for compatibility
  isCandidate?: boolean;         // 후보지 여부 for compatibility
  numericDbId?: number | null;    // 숫자 DB ID for compatibility
  details?: {                    // 상세 정보
    categories?: string;         // 카테고리 상세
    link?: string;               // 웹사이트 링크
    instagram?: string;          // 인스타그램 링크
  };
  // Properties from ItineraryPlaceWithTime for wider compatibility
  arriveTime?: string;
  departTime?: string;
  stayDuration?: string;
  travelTimeToNext?: string;
}

