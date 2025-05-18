import { useCallback } from 'react';
import { ItineraryDay, ItineraryPlaceWithTime, CategoryName, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, Place } from '@/types'; // Updated imports
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: Place[]; // Use the base Place type or a specific one if needed
}

interface MapContextGeoNode {
  id: string | number;
  coordinates: [number, number];
}

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

export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[],
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
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    startDate: Date
  ): ItineraryDay[] => {
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
      const dayKey = item.time_block.split('_')[0];
      if (!dayMap.has(dayKey)) {
        dayMap.set(dayKey, []);
      }
      dayMap.get(dayKey)?.push(item);
    });
    
    console.log("[parseServerResponse] 날짜별 그룹화 결과:", Object.fromEntries(dayMap));
    
    const dayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']; // Full week for robustness
    const dayToNumber: Record<string, number> = {};
    
    // Sort route_summary by day according to dayOrder to ensure correct day numbering
    const sortedRouteSummary = [...route_summary].sort((a, b) => {
        const aIndex = dayOrder.indexOf(a.day);
        const bIndex = dayOrder.indexOf(b.day);
        // Handle days not in dayOrder (e.g., put them at the end or error)
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        return aIndex - bIndex;
    });

    sortedRouteSummary.forEach((routeInfo, index) => {
        dayToNumber[routeInfo.day] = index + 1; 
    });

    const dateStrings: Record<string, string> = {};
    const dayOfWeekStrings: Record<string, string> = {}; // For full day name e.g. "목요일"
    const dayOfWeekAbbrev: Record<string, string> = {}; // For abbreviation e.g. "목"

    const dayNamesFull = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const dayNamesAbbrev = ['일', '월', '화', '수', '목', '금', '토'];

    sortedRouteSummary.forEach((routeInfo) => {
        const dayKey = routeInfo.day; 
        const dayNum = dayToNumber[dayKey];
        if (dayNum !== undefined) {
            const currentDayDate = new Date(startDate);
            currentDayDate.setDate(startDate.getDate() + dayNum - 1); 

            const month = currentDayDate.getMonth() + 1;
            const dayOfMonth = currentDayDate.getDate();
            dateStrings[dayKey] = `${month.toString().padStart(2, '0')}/${dayOfMonth.toString().padStart(2, '0')}`;
            
            const dayOfWeekIndex = currentDayDate.getDay();
            dayOfWeekStrings[dayKey] = dayNamesFull[dayOfWeekIndex]; // Full name
            dayOfWeekAbbrev[dayKey] = dayNamesAbbrev[dayOfWeekIndex]; // Abbreviation for ItineraryDay.dayOfWeek
        }
    });
    
    console.log("[parseServerResponse] 날짜 문자열:", dateStrings);
    console.log("[parseServerResponse] 요일 문자열 (축약):", dayOfWeekAbbrev);
    
    const result: ItineraryDay[] = [];
    
    sortedRouteSummary.forEach((routeInfo: ServerRouteSummaryItem) => {
      const dayKey = routeInfo.day; 
      const dayNumber = dayToNumber[dayKey] || 0;
      const placesForDayKey = dayMap.get(dayKey) || [];
      
      const placesWithTime: ItineraryPlaceWithTime[] = placesForDayKey.map((placeItem: ServerScheduleItem, index: number) => {
        const timeBlockContent = placeItem.time_block.split('_')[1] || "0000";
        const hour = timeBlockContent.substring(0, 2);
        const minute = timeBlockContent.substring(2, 4);
        const formattedTime = (timeBlockContent === "시작" || timeBlockContent === "끝") ? timeBlockContent : `${hour}:${minute}`;
        
        const originalPlace = currentSelectedPlaces.find(p => p.name === placeItem.place_name);

        // Ensure all fields for ItineraryPlaceWithTime are populated
        return {
          id: String(placeItem.id || `temp_${dayKey}_${index}`), 
          name: placeItem.place_name || `장소 ${placeItem.id || index}`,
          category: (placeItem.place_type || 'unknown') as CategoryName,
          x: originalPlace?.x || 0, 
          y: originalPlace?.y || 0,
          address: originalPlace?.address || '',
          phone: originalPlace?.phone || '',
          description: originalPlace?.description || '',
          rating: originalPlace?.rating || 0,
          image_url: originalPlace?.image_url || '',
          road_address: originalPlace?.road_address || '',
          homepage: originalPlace?.homepage || '',
          operationTimeData: originalPlace?.operationTimeData,
          geoNodeId: String(placeItem.id || `temp_${dayKey}_${index}`), 
          timeBlock: formattedTime,
          // Populate other fields from originalPlace if they exist on ItineraryPlaceWithTime
        } as ItineraryPlaceWithTime; // Cast to ensure all fields are considered
      });
      
      const currentInterleavedRoute = routeInfo.interleaved_route || [];

      const itineraryDay: ItineraryDay = {
        day: dayNumber,
        dayOfWeek: dayOfWeekAbbrev[dayKey] || dayKey, // Use abbrev as per user's type
        date: dateStrings[dayKey] || '',
        places: placesWithTime,
        totalDistance: routeInfo.total_distance_m / 1000,
        interleaved_route: currentInterleavedRoute, // number[]
        routeData: { 
          nodeIds: extractAllNodesFromRoute(currentInterleavedRoute).map(String), // Convert numbers to strings
          linkIds: extractAllLinksFromRoute(currentInterleavedRoute).map(String)  // Convert numbers to strings
        }
      };
      result.push(itineraryDay);
    });
    
    // result is already sorted if sortedRouteSummary was used. If not, sort here.
    // result.sort((a, b) => a.day - b.day); // Already sorted if using sortedRouteSummary
    console.log("[parseServerResponse] 최종 변환 결과:", JSON.parse(JSON.stringify(result)));
    return result;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
