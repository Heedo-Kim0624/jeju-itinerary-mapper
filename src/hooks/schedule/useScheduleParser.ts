import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName, Place, toCategoryName, toCategoryNameKorean } from '@/types/index';
import { NewServerScheduleResponse, ScheduleEntry, DailyRouteSummary, RouteData } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute, parseInterleavedRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[]; // raw 장소 정보 조회용
}

// GeoJSON 노드 관련 함수들은 MapContext 또는 GeoJsonLayer 내부로 이동하는 것이 적절해 보입니다.
// 여기서는 일단 주석 처리합니다. 필요시 MapContext를 통해 좌표를 가져오는 로직으로 대체합니다.
/*
interface MapContextGeoNode { ... }
export const findCoordinatesFromMapContextNodes = ( ... ) => { ... };
export const updateItineraryWithCoordinates = ( ... ) => { ... };
*/

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseSchedule = useCallback((
    response: NewServerScheduleResponse,
    tripStartDateISO: string // ISO 문자열로 받음
  ): ItineraryDay[] => {
    console.log('[useScheduleParser] Processing server response:', response);
    if (!response || !response.schedule || !response.route_summary) {
      console.error('[useScheduleParser] Invalid server response structure:', response);
      return [];
    }
    if (!tripStartDateISO) {
      console.error("[useScheduleParser] Trip start date (ISO string) is required.");
      return [];
    }

    const tripStartDate = new Date(tripStartDateISO);
    const { schedule, route_summary } = response;

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    
    const formatDateForDisplay = (date: Date): string => {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };
    const dayIndexToDayNameAbbrev = (index: number): string => {
      const dayNames = ['일', '월', '화', '수', '목', '금', '토']; // 한국어 요일
      return dayNames[index % 7];
    };

    const itineraryDays: ItineraryDay[] = route_summary.map((summaryItem: DailyRouteSummary, index: number) => {
      // 서버에서 오는 day ("Tue", "Wed" 등)를 기반으로 날짜 계산
      // 서버 응답의 요일 순서가 실제 날짜 순서와 일치한다고 가정
      const currentTripDate = new Date(tripStartDate);
      currentTripDate.setDate(tripStartDate.getDate() + index); // index를 날짜 offset으로 사용

      const tripDayNumber = index + 1; // 1일차, 2일차...

      // 이 날의 장소 정보 생성
      const placesForThisDay: ItineraryPlaceWithTime[] = [];
      
      // schedule 항목에서 이 날짜에 해당하는 장소들을 필터링하고 순서대로 배치
      // time_block (e.g., "Tue_0900")을 기준으로 필터링
      const currentDayScheduleEntries = schedule.filter(entry => entry.time_block.startsWith(summaryItem.day));
      
      // interleaved_route에서 실제 장소 노드 ID (짝수 인덱스) 추출
      const placeNodeIdsInRoute = summaryItem.interleaved_route.filter((_, i) => i % 2 === 0);

      // places_routed 또는 places_scheduled가 있다면 그것을 기준으로 할 수도 있으나,
      // 명세에서는 ScheduleEntry의 id가 NODE_ID와 일치한다고 했으므로 이를 활용
      placeNodeIdsInRoute.forEach(nodeId => {
        const matchingScheduleEntry = currentDayScheduleEntries.find(entry => entry.id === nodeId);
        if (matchingScheduleEntry) {
          const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === matchingScheduleEntry.place_name) || 
                                   currentSelectedPlaces.find(p => p.geoNodeId === nodeId); // geoNodeId로도 찾아보기

          const timeStr = matchingScheduleEntry.time_block.split('_')[1] || ''; // "0900"
          const formattedTime = timeStr ? `${timeStr.substring(0,2)}:${timeStr.substring(2,4)}` : '';


          placesForThisDay.push({
            id: String(nodeId), // 일관성을 위해 string으로 변환
            name: matchingScheduleEntry.place_name,
            category: toCategoryName(matchingScheduleEntry.place_type), // 영문 CategoryName으로 변환
            timeBlock: formattedTime, // "09:00" 형식
            x: existingPlaceInfo?.x || 0,
            y: existingPlaceInfo?.y || 0,
            address: existingPlaceInfo?.address || '',
            phone: existingPlaceInfo?.phone || '',
            description: existingPlaceInfo?.description || '',
            rating: existingPlaceInfo?.rating || 0,
            image_url: existingPlaceInfo?.image_url || '',
            road_address: existingPlaceInfo?.road_address || '',
            homepage: existingPlaceInfo?.homepage || '',
            isSelected: !!existingPlaceInfo?.isSelected,
            isCandidate: !!existingPlaceInfo?.isCandidate,
            geoNodeId: String(nodeId), // geoNodeId 저장
          });
        } else {
          // 스케줄 엔트리에 없지만 경로에는 있는 노드 (중간 경유지 등) - 필요시 처리
          // console.warn(`Node ID ${nodeId} found in route but not in schedule for day ${summaryItem.day}`);
        }
      });
      
      // routeData 구성
      const routeNodeIds = summaryItem.interleaved_route.filter((_, i) => i % 2 === 0);
      const routeLinkIds = summaryItem.interleaved_route.filter((_, i) => i % 2 === 1);

      return {
        day: tripDayNumber,
        places: placesForThisDay,
        totalDistance: summaryItem.total_distance_m / 1000, // km로 변환
        interleaved_route: summaryItem.interleaved_route, // 원본 숫자 배열 유지
        routeData: { // RouteData 형식에 맞게
          nodeIds: routeNodeIds,
          linkIds: routeLinkIds,
        },
        dayOfWeek: dayIndexToDayNameAbbrev(currentTripDate.getDay()),
        date: formatDateForDisplay(currentTripDate),
      };
    });

    itineraryDays.sort((a, b) => a.day - b.day);
    console.log('[useScheduleParser] Processed itinerary days:', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;

  }, [currentSelectedPlaces]);
  
  // updateItineraryWithCoordinates는 MapContext 또는 GeoJsonLayer에서 처리하도록 하고,
  // 여기서는 파싱된 일정만 반환합니다. 좌표 주입은 별도 단계로.
  return { parseSchedule };
};
