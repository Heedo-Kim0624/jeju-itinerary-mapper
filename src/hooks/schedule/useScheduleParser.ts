
import { useCallback } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { 
  NewServerScheduleResponse, 
  ServerScheduleItem, 
  ServerRouteSummaryItem, 
  ItineraryPlaceWithTime as ScheduleItineraryPlaceWithTime, // 이름 변경 적용
  ItineraryDay as ScheduleItineraryDay 
} from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { CategoryName } from '@/utils/categoryUtils';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ScheduleItineraryDay[] => {
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    const nodeToPlaceMap = new Map<string, ScheduleItineraryPlaceWithTime>(); // 타입 변경 적용
    response.schedule.forEach((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p =>
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );

      let placeDetail: ScheduleItineraryPlaceWithTime; // 타입 변경 적용
      if (existingPlace) {
        placeDetail = {
          ...existingPlace, // SelectedPlace는 Place를 확장하므로 호환 가능
          category: item.place_type as CategoryName, // Place의 category를 오버라이드
          timeBlock: item.time_block,
          node_id: item.node_id || item.place_info?.node_id || existingPlace.node_id,
          // ItineraryPlaceWithTime에만 있는 필드들 (arriveTime, departTime 등)은 existingPlace에 없을 수 있으므로,
          // 필요하다면 기본값 또는 undefined로 명시적 할당 필요
          // 예: arriveTime: existingPlace.arriveTime || undefined, 
        } as ScheduleItineraryPlaceWithTime; // 타입 단언으로 부족한 필드 커버 (주의)
      } else {
        placeDetail = {
          id: item.id?.toString() || item.place_name,
          name: item.place_name,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
          node_id: item.node_id || item.place_info?.node_id,
          x: item.x ?? item.place_info?.x ?? 0,
          y: item.y ?? item.place_info?.y ?? 0,
          address: item.address || '',
          phone: item.phone || '',
          description: item.description || '',
          rating: item.rating || 0,
          image_url: item.image_url || '',
          road_address: item.road_address || '', // Place에서 상속
          homepage: item.homepage || '', // Place에서 상속
          isSelected: false, // Place에서 상속
          isCandidate: false, // Place에서 상속
          operationTimeData: {}, // Place에서 상속
          // ItineraryPlaceWithTime 나머지 필드 (Place에서 상속되지 않는 것들)
          arriveTime: undefined, 
          departTime: undefined,
          stayDuration: undefined,
          travelTimeToNext: undefined,
          // Place에 있지만 여기서 명시적으로 다시 정의된 필드들
          geoNodeId: undefined,
          geoNodeDistance: undefined,
          weight: undefined,
          raw: undefined,
          categoryDetail: undefined,
          reviewCount: undefined,
          naverLink: undefined,
          instaLink: undefined,
          operatingHours: undefined,
        };
      }
      if (placeDetail.node_id) nodeToPlaceMap.set(String(placeDetail.node_id), placeDetail);
      // Ensure id is string for map key consistency if it can be number
      nodeToPlaceMap.set(String(placeDetail.id), placeDetail); 
    });

    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeekString = summaryItem.day.substring(0, 3);
      const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString] ?? (new Date().getDay());
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) tripDayNumber += 7;

      const currentDayDate = new Date(tripStartDate);
      currentDayDate.setDate(tripStartDate.getDate() + tripDayNumber - 1);
      const dateString = `${String(currentDayDate.getMonth() + 1).padStart(2, '0')}/${String(currentDayDate.getDate()).padStart(2, '0')}`;

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);
      
      const dayPlaces: ScheduleItineraryPlaceWithTime[] = placeNodeIdsInRoute.map(nodeId => { // 타입 변경 적용
        return nodeToPlaceMap.get(nodeId) || {
          id: nodeId, name: `경유지 ${nodeId}`, category: '경유지' as CategoryName,
          x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
          image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false, node_id: nodeId,
          operationTimeData: {}, geoNodeId: undefined, geoNodeDistance: undefined, weight: undefined, raw: undefined,
          categoryDetail: undefined, reviewCount: undefined, naverLink: undefined, instaLink: undefined, operatingHours: undefined,
          // ItineraryPlaceWithTime 나머지 필드
          timeBlock: undefined, arriveTime: undefined, departTime: undefined, stayDuration: undefined, travelTimeToNext: undefined,
        } as ScheduleItineraryPlaceWithTime; // 타입 단언
      });

      return {
        day: tripDayNumber,
        dayOfWeek: routeDayOfWeekString,
        date: dateString,
        places: dayPlaces,
        totalDistance: summaryItem.total_distance_m / 1000, // 이미 km 단위일 수 있음, 확인 필요
        interleaved_route: summaryItem.interleaved_route,
        routeData: {
          nodeIds: placeNodeIdsInRoute,
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
