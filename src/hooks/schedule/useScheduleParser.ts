
import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName, RouteSegment } from '@/types/supabase'; // RouteSegment 추가
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem, ParsedRoute } from '@/types/schedule'; // ParsedRoute 추가
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { format, addDays } from 'date-fns'; // format, addDays 추가
import { ko } from 'date-fns/locale'; // 한국어 로케일 추가

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

// 인터리브된 경로를 세그먼트별로 파싱 (내부 유틸리티 함수)
const parseInterleavedRouteToSegments = (interleavedRoute: (string | number)[]): ParsedRoute[] => {
  const segments: ParsedRoute[] = [];
  if (!interleavedRoute || interleavedRoute.length < 1) {
    return segments;
  }

  let currentLinks: (string | number)[] = [];
  let fromNode: string | number | null = null;

  for (let i = 0; i < interleavedRoute.length; i++) {
    const item = interleavedRoute[i];
    // ID는 항상 문자열로 처리
    const itemIdStr = String(item);

    if (i % 2 === 0) { // Node ID
      if (fromNode !== null) { // 두 번째 노드부터 세그먼트 형성
        segments.push({
          from: fromNode,
          to: itemIdStr,
          links: [...currentLinks]
        });
      }
      fromNode = itemIdStr;
      currentLinks = []; // 새 노드 시작 시 링크 초기화
    } else { // Link ID
      currentLinks.push(itemIdStr);
    }
  }
  return segments;
};


export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p =>
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );
      
      // timeBlock에서 시간 정보 추출 및 stayDuration, arriveTime, departTime 계산 로직 (간단화된 예시)
      let arriveTime, departTime, stayDuration;
      if (item.time_block) {
        const times = item.time_block.match(/(\d{2}:\d{2}) - (\d{2}:\d{2})/);
        if (times && times.length === 3) {
          arriveTime = times[1];
          departTime = times[2];
          // stayDuration 계산 (예: "09:00 - 10:30" -> 90분)
          const [arrH, arrM] = arriveTime.split(':').map(Number);
          const [depH, depM] = departTime.split(':').map(Number);
          stayDuration = (depH * 60 + depM) - (arrH * 60 + arrM);
        } else if (item.time_block.includes('도착')) {
            arriveTime = item.time_block.split(' ')[0];
        }
      }

      if (existingPlace) {
        return {
          ...existingPlace,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
          arriveTime,
          departTime,
          stayDuration,
        };
      }
      return {
        id: item.id?.toString() || item.place_name,
        name: item.place_name,
        category: item.place_type as CategoryName,
        timeBlock: item.time_block,
        x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
        image_url: '', road_address: '', homepage: '',
        isSelected: false, isCandidate: false,
        arriveTime,
        departTime,
        stayDuration,
      } as ItineraryPlaceWithTime;
    });

    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeekString = summaryItem.day.substring(0, 3);
      const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString];
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) {
        tripDayNumber += 7;
      }

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);
      
      let dayPlaces = allServerPlaces.filter(p => {
        const pIdStr = String(p.geoNodeId || p.id); // geoNodeId 우선 사용
        return placeNodeIdsInRoute.includes(pIdStr);
      });

      // 경로 순서대로 장소 정렬
      dayPlaces.sort((a, b) => {
        const aIndex = placeNodeIdsInRoute.indexOf(String(a.geoNodeId || a.id));
        const bIndex = placeNodeIdsInRoute.indexOf(String(b.geoNodeId || b.id));
        return aIndex - bIndex;
      });
      
      // travelTimeToNext 계산 및 할당
      dayPlaces = dayPlaces.map((place, index, arr) => {
        let travelTimeToNextStr: string | undefined = undefined;
        if (index < arr.length - 1) {
          // 실제로는 장소 간 이동 시간을 API 또는 다른 방식으로 계산해야 함
          // 여기서는 임의의 값 또는 로직으로 대체
          // 예: 다음 장소의 arriveTime과 현재 장소의 departTime 차이
          const currentDepart = place.departTime;
          const nextArrive = arr[index+1].arriveTime;
          if(currentDepart && nextArrive) {
            const [depH, depM] = currentDepart.split(':').map(Number);
            const [arrH, arrM] = nextArrive.split(':').map(Number);
            const diffMinutes = (arrH * 60 + arrM) - (depH * 60 + depM);
            if (diffMinutes > 0) {
                 travelTimeToNextStr = `${diffMinutes}분`;
            } else {
                 travelTimeToNextStr = `정보 없음`; // 혹은 0분
            }
          } else {
            travelTimeToNextStr = `계산 불가`;
          }
        }
        return { ...place, travelTimeToNext: travelTimeToNextStr };
      });
      
      const parsedSegments = parseInterleavedRouteToSegments(summaryItem.interleaved_route);
      const routeSegmentsForDay: RouteSegment[] = parsedSegments.map(segment => ({
        from: String(segment.from), // ensure string
        to: String(segment.to),     // ensure string
        links: segment.links.map(String) // ensure string array
      }));

      return {
        day: tripDayNumber,
        places: dayPlaces,
        totalDistance: summaryItem.total_distance_m / 1000,
        interleaved_route: summaryItem.interleaved_route,
        routeData: {
          nodeIds: placeNodeIdsInRoute,
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
          segmentRoutes: routeSegmentsForDay, // 수정된 RouteSegment 사용
        }
      };
    });
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
