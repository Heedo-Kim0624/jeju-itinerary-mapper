
import { useCallback } from 'react';
// 모든 타입을 @/types/index.ts 또는 @/types/schedule.ts 에서 가져오도록 수정
import type { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName, Place } from '@/types';
import type { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule'; // schedule.ts에서 직접 가져옴
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: Place[]; // SelectedPlace 대신 Place 사용 (id: string, category: CategoryName)
}

// ... (MapContextGeoNode, findCoordinatesFromMapContextNodes, updateItineraryWithCoordinates 함수는 변경 없음)
// Helper interface for GeoJSON nodes expected from MapContext
interface MapContextGeoNode {
  id: string; // This should be the NODE_ID
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
      // place.id는 string. 서버 응답의 place.id (NODE_ID)는 number일 수 있음.
      // findCoordinatesFromMapContextNodes는 string | number를 받으므로 괜찮음.
      const coordinates = findCoordinatesFromMapContextNodes(place.id, mapContextGeoNodes);
      if (coordinates) {
        return {
          ...place,
          x: coordinates[0], // longitude
          y: coordinates[1], // latitude
          geoNodeId: String(place.id), // place.id가 이미 geoNodeId 역할
        };
      }
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};


export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    console.log('[useScheduleParser] 서버 응답 처리 시작:', response);
    if (!response || !response.schedule || !response.route_summary) {
      console.error('[useScheduleParser] 잘못된 서버 응답 구조:', response);
      return [];
    }
    if (!tripStartDate) {
      console.error("[useScheduleParser] 일정 시작 날짜가 없어 서버 응답을 파싱할 수 없습니다.");
      return [];
    }

    const { schedule, route_summary } = response;
    
    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeekIndex = tripStartDate.getDay();

    const formatDateForDisplay = (date: Date): string => {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };
    const dayIndexToDayNameAbbrev = (index: number): string => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[index % 7];
    };

    const itineraryDays: ItineraryDay[] = route_summary.map((summaryItem: ServerRouteSummaryItem, index: number) => {
      const routeDayAbbrev = summaryItem.day.substring(0, 3); 
      const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev];
      if (routeDayOfWeekIndex === undefined) {
        console.error(`[useScheduleParser] 알 수 없는 요일 문자열: ${summaryItem.day}`);
        // fallback 또는 오류 처리
      }

      let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
      if (dayNumberOffset < 0) dayNumberOffset += 7; 

      const currentTripDate = new Date(tripStartDate);
      currentTripDate.setDate(tripStartDate.getDate() + dayNumberOffset);
      
      const tripDayNumber = index + 1; 
      const interleaved_route = summaryItem.interleaved_route || [];
      
      // places_scheduled 또는 places_routed를 사용해 장소 목록 생성
      // 사용자 프롬프트에서 schedule 항목의 id가 NODE_ID라고 명시.
      // route_summary.interleaved_route의 짝수 인덱스도 NODE_ID.
      // 이 둘을 매칭하거나, schedule을 기준으로 장소 정보를 만듦.

      const placesForThisDay: ItineraryPlaceWithTime[] = [];
      const placeNodeIdsInOrder = interleaved_route.filter((_, i) => i % 2 === 0).map(String);

      placeNodeIdsInOrder.forEach(nodeIdStr => {
        // schedule 배열에서 해당 nodeId (string 또는 number로 올 수 있음)를 가진 항목 찾기
        const scheduleItem = schedule.find(item => String(item.id) === nodeIdStr);
        if (scheduleItem) {
          const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === scheduleItem.place_name); // 또는 ID 기반 매칭
          
          // place_type을 CategoryName으로 변환 시도
          let category: CategoryName = '관광지'; // 기본값
          if (['숙소', '관광지', '음식점', '카페'].includes(scheduleItem.place_type as string)) {
            category = scheduleItem.place_type as CategoryName;
          } else {
            console.warn(`[useScheduleParser] 알 수 없는 장소 타입 '${scheduleItem.place_type}'을 기본값으로 처리합니다.`);
          }

          placesForThisDay.push({
            id: nodeIdStr, // string으로 통일 (NODE_ID)
            name: scheduleItem.place_name,
            category: category, // CategoryName 타입으로
            timeBlock: scheduleItem.time_block, // "Tue_0900" 같은 형식
            x: existingPlaceInfo?.x || 0,
            y: existingPlaceInfo?.y || 0,
            address: existingPlaceInfo?.address || '',
            phone: existingPlaceInfo?.phone || '',
            description: existingPlaceInfo?.description || '',
            rating: existingPlaceInfo?.rating || 0,
            image_url: existingPlaceInfo?.image_url || '',
            road_address: existingPlaceInfo?.road_address || '',
            homepage: existingPlaceInfo?.homepage || '',
            isSelected: existingPlaceInfo?.isSelected || false,
            isCandidate: existingPlaceInfo?.isCandidate || false,
            // geoNodeId는 nodeIdStr과 동일하게 사용 가능
            geoNodeId: nodeIdStr,
          });
        } else {
           console.warn(`[useScheduleParser] 스케줄에 NODE_ID ${nodeIdStr}에 해당하는 장소가 없습니다. 경로에는 포함됨.`);
           // 스케줄에 없지만 경로에만 있는 노드(중간 경유지 등) 처리. 여기선 일단 이름만 넣음.
           placesForThisDay.push({
             id: nodeIdStr, name: `경유지 ${nodeIdStr}`, category: '관광지', x:0,y:0, address:'',phone:'',description:'',rating:0,image_url:'',road_address:'',homepage:'',isSelected:false,isCandidate:false,geoNodeId:nodeIdStr
           });
        }
      });
      
      return {
        day: tripDayNumber,
        places: placesForThisDay,
        totalDistance: summaryItem.total_distance_m / 1000,
        interleaved_route: interleaved_route,
        routeData: {
          nodeIds: extractAllNodesFromRoute(interleaved_route).map(String),
          linkIds: extractAllLinksFromRoute(interleaved_route).map(String),
        },
        dayOfWeek: dayIndexToDayNameAbbrev(currentTripDate.getDay()),
        date: formatDateForDisplay(currentTripDate),
      };
    });

    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] 파싱 완료된 일정 데이터 (좌표 업데이트 전):', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
