
/**
 * Organizes route summary data by day.
 * @param routeSummary The array of route summary items from the server.
 * @returns A Map where keys are day strings (e.g., "Mon") and values are the route summary objects for that day.
 */
export const organizeRouteByDay = (routeSummary: any[]): Map<string, any> => {
  const routeByDay = new Map<string, any>();

  if (!routeSummary) {
    return routeByDay;
  }

  routeSummary.forEach(route => {
    // Assuming route object has a 'day' property like "Mon", "Tue"
    if (route && route.day) {
      routeByDay.set(route.day, route);
    }
  });

  return routeByDay;
};
