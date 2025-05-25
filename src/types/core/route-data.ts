
/**
 * Types related to route data and segments
 */

// Route data interface
export interface RouteData {
  nodeIds: string[];
  linkIds: string[];
  segmentRoutes?: SegmentRoute[];
  day?: number; // 일자 정보 추가
  routeId?: string; // 경로 고유 식별자 추가
}

// Segment route interface
export interface SegmentRoute {
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
