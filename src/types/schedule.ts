
// 서버 경로 응답 타입 정의
export interface ServerRouteResponse {
  date?: string;
  status: string;
  message: string;
  nodeIds?: string[];
  linkIds?: string[];
  data?: any;
}

// 일정 생성 서버 응답 타입
export interface ServerScheduleResponse {
  status: string;
  message: string;
  itinerary?: any[];
  routes?: Record<number, ServerRouteResponse>;
  data?: any;
}
