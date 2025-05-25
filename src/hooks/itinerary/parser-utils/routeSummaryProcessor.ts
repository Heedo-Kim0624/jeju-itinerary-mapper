
/**
 * Processes route data for an itinerary day.
 * Extracts node IDs, link IDs, interleaved route, and total distance.
 */
export const processRouteData = (routeInfo: any) => {
  const nodeIds: string[] = [];
  const linkIds: string[] = [];
  const interleaved_route_strings: string[] = []; // Ensure all IDs are strings

  if (routeInfo && routeInfo.interleaved_route) {
    // Ensure all IDs in interleaved_route are strings for consistency
    const temp_interleaved_route_strings = routeInfo.interleaved_route.map((id: number | string) => String(id));

    temp_interleaved_route_strings.forEach((idStr: string, index: number) => {
      interleaved_route_strings.push(idStr);
      // Assuming [NODE, LINK, NODE, LINK, ...]
      if (index % 2 === 0) { // Node ID at even indices (0, 2, 4...)
         nodeIds.push(idStr);
      } else { // Link ID at odd indices (1, 3, 5...)
         linkIds.push(idStr);
      }
    });
  }

  const totalDistance = routeInfo?.total_distance_m ? routeInfo.total_distance_m / 1000 : 0;

  return {
    nodeIds,
    linkIds,
    interleaved_route: interleaved_route_strings, // Return string array
    totalDistance,
    segmentRoutes: routeInfo?.segment_routes || []
  };
};
