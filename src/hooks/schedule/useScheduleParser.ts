
import { useCallback } from 'react';
import { 
  SelectedPlace, 
  ItineraryDay, 
  ItineraryPlaceWithTime, 
  CategoryName,
  // RouteSegment, // Already defined in types/schedule.ts if we use that, or defined locally
} from '@/types/supabase'; // ItineraryDay & ItineraryPlaceWithTime will use definitions from here after propagation
import { 
  NewServerScheduleResponse, 
  ServerScheduleItem, 
  ServerRouteSummaryItem,
  RouteSegment, // Using RouteSegment from types/schedule.ts
} from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  // 요일을 날짜로 변환하는 함수 (startDate 기준)
  const convertDayToDate = (dayOfWeekShort: string, dayIndexInSummary: number, startDate: Date): string => {
    const dayMap: {[key: string]: number} = { // 0: Sun, 1: Mon, ..., 6: Sat
      'Sun': 0, 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6
    };
    
    const targetDayNumber = dayMap[dayOfWeekShort];
    if (targetDayNumber === undefined) return "N/A";

    const currentDayOfTrip = new Date(startDate);
    // Calculate the actual date for this day of the trip based on its occurrence in route_summary
    // This assumes route_summary items are chronologically ordered.
    // A more robust way might involve parsing item.day if it's a full date string,
    // or associating each summaryItem with a specific trip day number (1, 2, 3...).
    // For now, using dayIndexInSummary to advance days from tripStartDate.
    currentDayOfTrip.setDate(startDate.getDate() + dayIndexInSummary); // This simplified approach might be off if route_summary skips days or isn't perfectly aligned with trip days.

    return `${String(currentDayOfTrip.getMonth() + 1).padStart(2, '0')}/${String(currentDayOfTrip.getDate()).padStart(2, '0')}`;
  };


  // 서버 응답에서 구간별 정보 추출
  const extractRouteSegments = (
    routeSummary: ServerRouteSummaryItem,
    placeNodeMap: Record<string, string> // nodeId -> placeName 매핑
  ): RouteSegment[] => {
    const segments: RouteSegment[] = [];
    const interleaved = routeSummary.interleaved_route;
    
    if (!interleaved || interleaved.length < 3) return segments; // Need at least one segment (place-link-place)

    // 구간별 정보 추출
    for (let i = 0; i < interleaved.length - 2; i += 2) {
      const fromNodeId = String(interleaved[i]);
      const linkId = String(interleaved[i + 1]); // This is actually a link or intermediate node ID
      const toNodeId = String(interleaved[i + 2]);
      
      // 실제 장소 노드인 경우만 구간으로 처리
      if (placeNodeMap[fromNodeId] && placeNodeMap[toNodeId]) {
        // Placeholder for actual distance for this segment.
        // Ideally, server provides distance per segment or per link.
        // For now, using a portion of total_distance_m or random.
        // This random distance is a placeholder as per user prompt.
        const distance = Math.random() * 3000 + 500; // Random distance 0.5km to 3.5km
        
        segments.push({
          fromPlaceName: placeNodeMap[fromNodeId],
          fromNodeId,
          toPlaceName: placeNodeMap[toNodeId],
          toNodeId,
          distance, // in meters
          nodeCount: 2, // Placeholder: Actual nodes in this segment (from, to, and any intermediates)
          linkCount: 1, // Placeholder: Actual links in this segment
          nodes: [fromNodeId, toNodeId], // Simplified, could include intermediate nodes
          links: [String(linkId)] // Simplified, linkId here is the element between fromNodeId and toNodeId
        });
      }
    }
    console.log(`[useScheduleParser] Extracted ${segments.length} segments for day ${routeSummary.day}`);
    return segments;
  };

  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { // 0: Sun, 1: Mon, ..., 6: Sat
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6
    };
    // const tripStartDayOfWeek = tripStartDate.getDay(); // Not directly used for tripDayNumber calculation here.

    // 모든 장소 정보 추출 및 강화
    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p => 
        (item.id !== undefined && String(p.id) === String(item.id)) || 
        p.name === item.place_name
      );

      // Ensure nodeId is part of ItineraryPlaceWithTime
      const placeWithNodeId: Partial<ItineraryPlaceWithTime> = {
        nodeId: item.id?.toString() || '' // Assuming server item.id is the NODE_ID
      };

      if (existingPlace) {
        return {
          ...existingPlace,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
          ...placeWithNodeId,
        } as ItineraryPlaceWithTime; // Cast to ensure type compliance
      }

      return {
        id: item.id?.toString() || item.place_name, // Fallback id to place_name if item.id is undefined
        name: item.place_name,
        category: item.place_type as CategoryName,
        timeBlock: item.time_block,
        ...placeWithNodeId,
        x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
        image_url: '', road_address: '', homepage: '',
        isSelected: false, isCandidate: false,
      } as ItineraryPlaceWithTime; // Cast to ensure type compliance
    });

    // NODE_ID -> 장소명 매핑 생성
    const placeNodeMap: Record<string, string> = {};
    allServerPlaces.forEach(place => {
      if (place.nodeId) { // place.nodeId should exist due to mapping above
        placeNodeMap[place.nodeId] = place.name;
      } else if (place.id) { // Fallback if nodeId wasn't set from item.id
        placeNodeMap[String(place.id)] = place.name;
      }
    });
    
    console.log("[useScheduleParser] Place-NodeId Map:", placeNodeMap);

    // 일정 데이터 구조화
    return response.route_summary.map((summaryItem: ServerRouteSummaryItem, dayIndex: number) => {
      // Assuming summaryItem.day is like "Mon", "Tue"
      const routeDayOfWeekShort = summaryItem.day.substring(0, 3); 
      // Trip day number (1-indexed)
      // This assumes route_summary is ordered and corresponds to consecutive days of the trip.
      const tripDayNumber = dayIndex + 1; 

      // 노드 ID 추출 (장소 노드만)
      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route)
                                  .filter((id, index) => index % 2 === 0) // Assuming places are at even indices
                                  .map(String);
      
      // 해당 일자의 장소 필터링 및 정렬
      // Filter places that are part of this day's route AND have a mapped nodeId
      let dayPlaces = allServerPlaces.filter(p => {
        const pNodeId = p.nodeId || String(p.id);
        return pNodeId && placeNodeIdsInRoute.includes(pNodeId);
      });

      // Sort dayPlaces according to their order in placeNodeIdsInRoute
      dayPlaces.sort((a, b) => {
        const aNodeId = a.nodeId || String(a.id);
        const bNodeId = b.nodeId || String(b.id);
        return placeNodeIdsInRoute.indexOf(aNodeId) - placeNodeIdsInRoute.indexOf(bNodeId);
      });
      
      console.log(`[useScheduleParser] Day ${tripDayNumber} (${routeDayOfWeekShort}) - Initial places: ${dayPlaces.length}, Node IDs in route: ${placeNodeIdsInRoute.length}`);

      // 구간별 정보 추출
      const routeSegments = extractRouteSegments(summaryItem, placeNodeMap);
      
      // 각 장소에 다음 장소까지의 거리 정보 추가
      const placesWithDistance = dayPlaces.map((place) => {
        const currentPlaceNodeId = place.nodeId || String(place.id);
        const nextSegment = routeSegments.find(seg => 
          seg.fromNodeId === currentPlaceNodeId
        );
        
        let travelTimeMinutes = 0;
        if (nextSegment?.distance) {
          // 50km/h = 50000m / 60min = 833.33 m/min
          travelTimeMinutes = Math.round(nextSegment.distance / 833.33);
        }

        return {
          ...place,
          distanceToNext: nextSegment?.distance || 0, // meters
          nextPlaceName: nextSegment?.toPlaceName || '',
          travelTimeToNext: travelTimeMinutes, // minutes
        };
      });

      // 날짜 형식 변환
      const formattedDate = convertDayToDate(routeDayOfWeekShort, dayIndex, tripStartDate);
      
      console.log(`[useScheduleParser] Day ${tripDayNumber} processed. Places: ${placesWithDistance.length}, Date: ${formattedDate}`);

      return {
        day: tripDayNumber,
        dayOfWeek: summaryItem.day, // "Mon", "Tue", etc.
        date: formattedDate, // "MM/DD"
        places: placesWithDistance,
        totalDistance: summaryItem.total_distance_m / 1000, // km 단위로 변환
        interleaved_route: summaryItem.interleaved_route,
        routeSegments, // 구간별 정보 추가
        routeData: { // For map rendering if needed
          nodeIds: extractAllNodesFromRoute(summaryItem.interleaved_route).map(String),
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });
  }, [currentSelectedPlaces]);

  return {
    parseServerResponse
  };
};
