
/**
 * Utility functions for converting between different data structures
 */

import { 
  ServerScheduleItem,
  ServerRouteSummaryItem,
  NewServerScheduleResponse,
  PlannerServerRouteResponse
} from './server-responses';

// Convert PlannerServerRouteResponse to NewServerScheduleResponse
export function convertPlannerResponseToNewResponse(
  plannerResponse: PlannerServerRouteResponse[]
): NewServerScheduleResponse {
  const routeSummaryItems: ServerRouteSummaryItem[] = plannerResponse.map(item => {
    const date = new Date(item.date);
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' });
    return {
      day: dayOfWeek,
      status: 'OK',
      total_distance_m: 0,
      interleaved_route: item.nodeIds, // Server response is a number array, use as-is
      places_scheduled: [], // Default value
      places_routed: [],    // Default value
    };
  });

  const scheduleItems: ServerScheduleItem[] = [];
  plannerResponse.forEach(dayData => {
    dayData.nodeIds.forEach((nodeId, index) => {
      // Assuming actual places are even indexed, links are odd.
      if (index % 2 === 0 && typeof nodeId === 'number') { 
        scheduleItems.push({
          id: nodeId,
          place_name: `장소 ${nodeId}`, // Real place name mapping needed
          place_type: 'unknown', // Real place type mapping needed
          time_block: '시간 정보 없음', // Real time info mapping needed
        });
      }
    });
  });
  
  const result: NewServerScheduleResponse = {
    schedule: scheduleItems,
    route_summary: routeSummaryItems,
  };
  
  return result;
}
