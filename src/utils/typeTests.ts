// 이 파일은 테스트용으로 보이며, 실제 프로덕션 코드에는 포함되지 않을 수 있습니다.
// 에러를 수정하기 위해 import 경로만 수정합니다.
import { ItineraryDay, Place } from '@/types/index';
import { NewServerScheduleResponse, PlannerServerRouteResponse, ScheduleEntry, DailyRouteSummary, isNewServerScheduleResponse, isPlannerServerRouteResponseArray } from '@/types/schedule';

// 타입 확인 함수 예시
function checkItineraryDay(itineraryDay: ItineraryDay): boolean {
  return (
    typeof itineraryDay.day === 'number' &&
    Array.isArray(itineraryDay.places) &&
    typeof itineraryDay.totalDistance === 'number'
  );
}

// 서버 응답 타입 확인 (예시)
function checkServerResponse(response: NewServerScheduleResponse): boolean {
  return (
    Array.isArray(response.schedule) &&
    Array.isArray(response.route_summary)
  );
}

// PlannerServerRouteResponse 타입 확인
function checkPlannerServerRouteResponse(response: PlannerServerRouteResponse): boolean {
    return (
        typeof response.date === 'string' &&
        Array.isArray(response.nodeIds) &&
        response.nodeIds.every(id => typeof id === 'number')
    );
}

// ScheduleEntry 타입 확인
function checkScheduleEntry(entry: ScheduleEntry): boolean {
    return (
        typeof entry.id === 'number' &&
        typeof entry.place_name === 'string' &&
        typeof entry.place_type === 'string' &&
        typeof entry.time_block === 'string'
    );
}

// DailyRouteSummary 타입 확인
function checkDailyRouteSummary(summary: DailyRouteSummary): boolean {
    return (
        typeof summary.day === 'string' &&
        Array.isArray(summary.interleaved_route) &&
        typeof summary.status === 'string' &&
        typeof summary.total_distance_m === 'number'
    );
}
