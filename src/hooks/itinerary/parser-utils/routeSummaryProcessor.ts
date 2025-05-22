
/**
 * Processes route data for an itinerary day.
 * Extracts node IDs, link IDs, interleaved route, and total distance.
 */
export const processRouteData = (routeInfo: any) => {
  const nodeIds: string[] = [];
  const linkIds: string[] = [];
  const interleaved_route: (string | number)[] = [];

  if (routeInfo && routeInfo.interleaved_route) {
    routeInfo.interleaved_route.forEach((id: number | string) => {
      const idStr = String(id);
      interleaved_route.push(idStr);
      // A common pattern is that nodes start with 'N' or are odd in interleaved_route
      // However, the original logic was:
      // if (interleaved_route.length % 2 !== 0 || (typeof id === 'string' && id.startsWith('N')))
      // Let's assume for now that odd positions are nodes and even are links if not 'N' prefixed
      // This logic might need to be very specific to the server's route format.
      // The original logic:
      if (interleaved_route.length % 2 !== 0 || (typeof id === 'string' && id.startsWith('N'))) {
         nodeIds.push(idStr);
      } else {
         linkIds.push(idStr);
      }
    });
  }

  const totalDistance = routeInfo?.total_distance_m ? routeInfo.total_distance_m / 1000 : 0;

  return {
    nodeIds,
    linkIds,
    interleaved_route,
    totalDistance, // This is total distance for the day's route
    segmentRoutes: routeInfo?.segment_routes || [] // Keep segment_routes
  };
};
