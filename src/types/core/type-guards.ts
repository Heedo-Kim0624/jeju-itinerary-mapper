
/**
 * Type guard functions for runtime type checking
 */

import { NewServerScheduleResponse } from './server-responses';
import { PlannerServerRouteResponse } from './server-responses';

// Type guard for NewServerScheduleResponse
export function isNewServerScheduleResponse(obj: any): obj is NewServerScheduleResponse {
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.schedule) &&
    Array.isArray(obj.route_summary) &&
    obj.route_summary.length > 0 &&
    obj.route_summary.every((item: any) =>
      item !== null &&
      typeof item === 'object' &&
      typeof item.day === 'string' &&
      item.hasOwnProperty('status') &&
      item.hasOwnProperty('total_distance_m') &&
      (item.places_scheduled === undefined || Array.isArray(item.places_scheduled)) &&
      (item.places_routed === undefined || Array.isArray(item.places_routed)) &&
      Array.isArray(item.interleaved_route)
    )
  );
}

// Type guard for PlannerServerRouteResponseArray
export function isPlannerServerRouteResponseArray(
  response: any
): response is PlannerServerRouteResponse[] {
  return (
    Array.isArray(response) &&
    (response.length === 0 ||
      (response.length > 0 &&
        typeof response[0] === 'object' &&
        response[0] !== null &&
        typeof response[0].date === 'string' &&
        Array.isArray(response[0].nodeIds) &&
        response[0].nodeIds.every((id: any) => typeof id === 'number')))
  );
}
