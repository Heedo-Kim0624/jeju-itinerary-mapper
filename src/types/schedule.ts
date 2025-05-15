
export interface SchedulePlace {
  id: number;
  name: string;
}

export interface SchedulePayload {
  selected_places: SchedulePlace[];
  candidate_places: SchedulePlace[];
  start_datetime: string;
  end_datetime: string;
}

export interface ScheduleItem {
  time_block: string;
  place_type: string;
  place_name: string;
}

export interface DaySchedule {
  day: number;
  items: ScheduleItem[];
}

// 서버에서 받는 경로 응답 인터페이스
export interface ServerRouteResponse {
  date: string;            // 요일 또는 날짜 정보
  nodeIds: number[];       // 노드 ID 배열
  linkIds?: number[];      // 링크 ID 배열 (선택적)
  places?: SchedulePlace[]; // 장소 정보 배열 (선택적)
  status?: string;         // 상태 정보 (선택적)
  message?: string;        // 메시지 정보 (선택적)
}

// 추출된 경로 정보 인터페이스
export interface ExtractedRouteData {
  nodeIds: string[];       // 화면에 표시할 노드 ID 배열
  linkIds: string[];       // 화면에 표시할 링크 ID 배열
}
