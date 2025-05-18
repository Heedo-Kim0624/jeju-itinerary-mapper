
import { useCallback } from 'react';
// Ensure ItineraryDay and ItineraryPlaceWithTime are what your new parser expects/produces.
// These types might need to align with what use-itinerary (and use-itinerary-creator) defines.
// For now, using the ones from supabase as a reference, but your parser redefines the structure.
import type { ItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase'; 
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser'; // Keep if still needed after parser update

interface UseScheduleParserProps {
  currentSelectedPlaces: { // Assuming this structure for currentSelectedPlaces
    id: string | number;
    name: string;
    category: string;
    x?: number;
    y?: number;
    address?: string;
    // Add other fields if your parser uses them from currentSelectedPlaces
  }[];
}

// Helper interface for GeoJSON nodes expected from MapContext
interface MapContextGeoNode {
  id: string | number; // This should be the NODE_ID
  coordinates: [number, number]; // [longitude, latitude]
}

// Function to find coordinates from MapContext's GeoJSON nodes
export const findCoordinatesFromMapContextNodes = (
  nodeIdToFind: string | number,
  mapContextGeoNodes: MapContextGeoNode[] | null
): [number, number] | null => {
  if (!mapContextGeoNodes) return null;
  const nodeIdStr = String(nodeIdToFind);
  const foundNode = mapContextGeoNodes.find(node => String(node.id) === nodeIdStr);
  
  if (foundNode && foundNode.coordinates) {
    return foundNode.coordinates; // [longitude, latitude]
  }
  console.warn(`[findCoordinatesFromMapContextNodes] Coordinates not found for NODE_ID: ${nodeIdStr}`);
  return null;
};

// Function to update itinerary places with coordinates
export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[], // This ItineraryDay should match the output of your new parser
  mapContextGeoNodes: MapContextGeoNode[] | null
): ItineraryDay[] => {
  if (!mapContextGeoNodes || !itineraryDays.length) {
    if (!mapContextGeoNodes) console.warn("[updateItineraryWithCoordinates] mapContextGeoNodes is null or empty.");
    if (!itineraryDays.length) console.warn("[updateItineraryWithCoordinates] itineraryDays is empty.");
    return itineraryDays;
  }
  console.log("[updateItineraryWithCoordinates] Starting coordinate update. GeoNodes available:", mapContextGeoNodes.length > 0);

  return itineraryDays.map(day => {
    const updatedPlaces = day.places.map(place => {
      // Ensure place.id is suitable for lookup in mapContextGeoNodes
      const coordinates = findCoordinatesFromMapContextNodes(place.geoNodeId || place.id, mapContextGeoNodes);
      if (coordinates) {
        return {
          ...place,
          x: coordinates[0], // longitude
          y: coordinates[1], // latitude
        };
      }
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};


export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  // Your provided parseServerResponse function
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse, // Use the specific type
    startDate: Date
  ): ItineraryDay[] => { // ItineraryDay should be the structure your app expects
    console.log("[parseServerResponse] 서버 응답 파싱 시작:", serverResponse);
    
    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error("[parseServerResponse] 유효하지 않은 서버 응답:", serverResponse);
      return [];
    }
    
    const { schedule, route_summary } = serverResponse;
    
    console.log("[parseServerResponse] 스케줄 데이터:", schedule);
    console.log("[parseServerResponse] 경로 요약 데이터:", route_summary);
    
    const dayMap = new Map<string, ServerScheduleItem[]>();
    schedule.forEach((item: ServerScheduleItem) => {
      if (!item.time_block) {
        console.warn("[parseServerResponse] time_block이 없는 항목:", item);
        return;
      }
      const day = item.time_block.split('_')[0];
      if (!dayMap.has(day)) {
        dayMap.set(day, []);
      }
      dayMap.get(day)?.push(item);
    });
    
    console.log("[parseServerResponse] 날짜별 그룹화 결과:", Object.fromEntries(dayMap));
    
    // This dayToNumber mapping should align with how server sends 'day' (e.g., 'Mon', 'Tue')
    // The example used Thu, Fri, Sat. Ensure this is comprehensive or derived.
    // A more robust way would be to parse these day strings relative to startDate.
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const dayToNumber: Record<string, number> = {};
    route_summary.forEach((routeInfo, index) => {
        // Assuming route_summary is sorted by day by the server or should be sorted before this.
        // Assign day number based on order in route_summary if not inferable otherwise.
        dayToNumber[routeInfo.day] = index + 1; 
    });

    const dateStrings: Record<string, string> = {};
    const dayOfWeekStrings: Record<string, string> = {};

    route_summary.forEach((routeInfo) => {
        const dayKey = routeInfo.day; // 'Thu', 'Fri', etc.
        const dayNum = dayToNumber[dayKey];
        if (dayNum !== undefined) {
            const date = new Date(startDate);
            date.setDate(startDate.getDate() + dayNum -1); // dayNum is 1-indexed

            const month = date.getMonth() + 1;
            const dayOfMonth = date.getDate();
            dateStrings[dayKey] = `${month.toString().padStart(2, '0')}/${dayOfMonth.toString().padStart(2, '0')}`;
            
            const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
            dayOfWeekStrings[dayKey] = dayNames[date.getDay()];
        }
    });
    
    console.log("[parseServerResponse] 날짜 문자열:", dateStrings);
    
    const result: ItineraryDay[] = [];
    
    route_summary.forEach((routeInfo: ServerRouteSummaryItem) => {
      const dayKey = routeInfo.day; 
      const dayNumber = dayToNumber[dayKey] || 0; // Fallback to 0 if not found, though it should be.
      const placesForDayKey = dayMap.get(dayKey) || [];
      
      const placesWithTime: ItineraryPlaceWithTime[] = placesForDayKey.map((placeItem: ServerScheduleItem, index: number) => {
        const timeBlock = placeItem.time_block.split('_')[1] || "0000"; // '0900', '1200', etc. or default
        const hour = timeBlock.substring(0, 2);
        const minute = timeBlock.substring(2, 4);
        const formattedTime = (timeBlock === "시작" || timeBlock === "끝") ? timeBlock : `${hour}:${minute}`;
        
        const originalPlace = currentSelectedPlaces.find(p => p.name === placeItem.place_name);

        return {
          // ServerScheduleItem now has 'id', let's use it. If not present, fallback.
          id: placeItem.id || `temp_${dayKey}_${index}`, 
          name: placeItem.place_name || `장소 ${placeItem.id || index}`,
          category: (placeItem.place_type || 'unknown') as CategoryName,
          x: originalPlace?.x || 0, 
          y: originalPlace?.y || 0,
          address: originalPlace?.address || '',
          // phone, description, rating, image_url, road_address, homepage from originalPlace if needed
          timeBlock: formattedTime,
          // geoNodeId should be the ID that MapContext uses for GeoJSON nodes.
          // If placeItem.id from server is the GeoJSON node ID, use it.
          geoNodeId: String(placeItem.id || `temp_${dayKey}_${index}`), 
        } as ItineraryPlaceWithTime; // Cast to ensure all fields of ItineraryPlaceWithTime are considered
      });
      
      const itineraryDay: ItineraryDay = {
        day: dayNumber,
        dayOfWeek: dayOfWeekStrings[dayKey] || dayKey, // Use formatted day of week string
        date: dateStrings[dayKey] || '',
        places: placesWithTime,
        totalDistance: routeInfo.total_distance_m / 1000,
        interleaved_route: routeInfo.interleaved_route,
        routeData: { // These should be number[] as per ServerRouteResponse and interleaved_route
          nodeIds: routeInfo.interleaved_route.filter((_, i) => i % 2 === 0),
          linkIds: routeInfo.interleaved_route.filter((_, i) => i % 2 !== 0)
        }
      };
      result.push(itineraryDay);
    });
    
    result.sort((a, b) => a.day - b.day);
    console.log("[parseServerResponse] 최종 변환 결과:", JSON.parse(JSON.stringify(result)));
    return result;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
