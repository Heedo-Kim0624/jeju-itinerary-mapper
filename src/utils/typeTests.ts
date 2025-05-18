
import { 
  NewServerScheduleResponse, 
  ServerScheduleItem, 
  ServerRouteSummaryItem, 
  ServerRouteResponse, // Changed from PlannerServerRouteResponse
  isNewServerScheduleResponse 
} from '@/types'; // Using centralized types

// Removed: import { PlannerServerRouteResponse }
// Removed: isPlannerServerRouteResponseArray and its usage if it was for the old type

// Type guard for ServerRouteResponse
export function isServerRouteResponse(obj: any): obj is ServerRouteResponse {
  return (
    obj &&
    typeof obj === 'object' &&
    Array.isArray(obj.nodeIds) && obj.nodeIds.every(id => typeof id === 'number') &&
    Array.isArray(obj.linkIds) && obj.linkIds.every(id => typeof id === 'number') &&
    (obj.interleaved_route === undefined || (Array.isArray(obj.interleaved_route) && obj.interleaved_route.every(id => typeof id === 'number')))
  );
}

export function isServerRouteResponseArray(arr: any): arr is ServerRouteResponse[] {
  return Array.isArray(arr) && arr.every(isServerRouteResponse);
}


// Example usage to demonstrate type correctness (optional, for testing)
const mockServerScheduleItem: ServerScheduleItem = {
  id: 1,
  time_block: 'Mon_0900',
  place_name: 'Test Place',
  place_type: 'restaurant',
};

const mockServerRouteSummaryItem: ServerRouteSummaryItem = {
  day: 'Mon',
  status: '성공',
  total_distance_m: 1000,
  places_scheduled: ["Test Place"], // Added missing property
  places_routed: ["Test Place"],    // Added missing property
  interleaved_route: [123, 456, 789],
};

const mockNewServerScheduleResponse: NewServerScheduleResponse = {
  schedule: [mockServerScheduleItem],
  route_summary: [mockServerRouteSummaryItem],
};

const mockServerRouteResponse: ServerRouteResponse = {
  nodeIds: [1, 2, 3],
  linkIds: [101, 102],
  interleaved_route: [1, 101, 2, 102, 3],
};

// Test the type guards
console.log('isNewServerScheduleResponse valid:', isNewServerScheduleResponse(mockNewServerScheduleResponse));
console.log('isServerRouteResponse valid:', isServerRouteResponse(mockServerRouteResponse));

const exampleInvalidSummary: any = { day: 'Tue', status: 'ok', total_distance_m: 500, interleaved_route: [1] };
// This will fail because places_scheduled and places_routed are missing
// console.log('isNewServerScheduleResponse invalid summary item test:', isNewServerScheduleResponse({ schedule: [], route_summary: [exampleInvalidSummary]}));

