
import { ItineraryDay, RouteData, ItineraryPlaceWithTime, Place } from '@/types';

// Helper to get day of week string (e.g., "Mon")
const getDayOfWeekString = (date: Date): string => {
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
};

// Helper to get date string (e.g., "05/21")
const getDateStringMMDD = (date: Date): string => {
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const dayNum = date.getDate().toString().padStart(2, '0');
  return `${month}/${dayNum}`;
};

// Converts various source ItineraryDay-like structures to the standard ItineraryDay
export function convertToStandardItineraryDay(
  sourceItineraryArray: any[], // Array of day-like objects
  defaultStartDate: Date = new Date()
): ItineraryDay[] {
  if (!Array.isArray(sourceItineraryArray) || sourceItineraryArray.length === 0) {
    return [];
  }
  
  return sourceItineraryArray.map((daySource: any, index: number) => {
    const currentTripDate = new Date(defaultStartDate);
    currentTripDate.setDate(defaultStartDate.getDate() + index); // Assumes days are ordered sequentially

    // Ensure places are in ItineraryPlaceWithTime format
    const places: ItineraryPlaceWithTime[] = (Array.isArray(daySource.places) ? daySource.places : []).map((p: any): ItineraryPlaceWithTime => ({
      id: p.id || `temp-place-${index}-${Math.random()}`,
      name: p.name || 'Unknown Place',
      x: typeof p.x === 'number' ? p.x : 0,
      y: typeof p.y === 'number' ? p.y : 0,
      category: p.category || 'unknown',
      address: p.address,
      phone: p.phone,
      description: p.description,
      rating: p.rating,
      image_url: p.image_url,
      road_address: p.road_address,
      homepage: p.homepage,
      isSelected: !!p.isSelected,
      isCandidate: !!p.isCandidate,
      geoNodeId: p.geoNodeId ? String(p.geoNodeId) : String(p.id),
      arriveTime: p.arriveTime,
      departTime: p.departTime,
      stayDuration: p.stayDuration,
      travelTimeToNext: p.travelTimeToNext,
      timeBlock: p.timeBlock,
    }));

    // Ensure routeData is compliant
    const routeData: RouteData = {
      nodeIds: Array.isArray(daySource.routeData?.nodeIds) 
        ? daySource.routeData.nodeIds.map(String) 
        : (Array.isArray(daySource.nodeIds) ? daySource.nodeIds.map(String) : []), // Fallback for older structures
      linkIds: Array.isArray(daySource.routeData?.linkIds) 
        ? daySource.routeData.linkIds.map(String) 
        : (Array.isArray(daySource.linkIds) ? daySource.linkIds.map(String) : []), // Fallback
      segmentRoutes: daySource.routeData?.segmentRoutes || [],
    };
    
    // Standard ItineraryDay object
    return {
      day: typeof daySource.day === 'number' ? daySource.day : index + 1,
      places: places,
      totalDistance: typeof daySource.totalDistance === 'number' ? daySource.totalDistance : 0,
      routeData: routeData,
      interleaved_route: Array.isArray(daySource.interleaved_route) ? daySource.interleaved_route.map(String) : [],
      dayOfWeek: daySource.dayOfWeek || getDayOfWeekString(currentTripDate),
      date: daySource.date || getDateStringMMDD(currentTripDate),
    };
  });
}
