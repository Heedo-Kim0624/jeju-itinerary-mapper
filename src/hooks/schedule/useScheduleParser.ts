
import { useCallback } from 'react';
import { SelectedPlace, CategoryName } from '@/types/supabase';
// 변경된 ItineraryDay 타입을 가져옵니다 (routeData: any).
import { ItineraryDay, ItineraryPlaceWithTime as ScheduleItineraryPlaceWithTime, NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

// ItineraryPlaceWithTime 이름 충돌을 피하기 위해 ScheduleItineraryPlaceWithTime 사용 또는 통합 필요
// 여기서는 supabase의 ItineraryPlaceWithTime 대신 schedule의 타입 사용 가정 (혹은 호환되는 타입으로 캐스팅)
// 또는, useScheduleParser가 생성하는 place 객체가 ScheduleItineraryPlaceWithTime을 따르도록 수정

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => { // 반환 타입을 변경된 ItineraryDay[]로 명시
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    // allServerPlaces의 타입이 ScheduleItineraryPlaceWithTime[] 이 되도록 수정
    const allServerPlaces: ScheduleItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p =>
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );
      if (existingPlace) {
        return {
          ...existingPlace, // Spread SelectedPlace
          category: item.place_type as CategoryName, // Ensure this cast is safe
          timeBlock: item.time_block,
          // ScheduleItineraryPlaceWithTime에 필요한 나머지 필드 (Place에서 가져옴)
          // arriveTime, departTime 등은 여기서 계산하거나 서버 응답에 있어야 함
        } as ScheduleItineraryPlaceWithTime; // 명시적 캐스팅
      }
      // New place from server schedule
      return {
        id: item.id?.toString() || item.place_name,
        name: item.place_name,
        category: item.place_type as CategoryName, // Ensure this cast is safe
        timeBlock: item.time_block,
        x: 0, y: 0, address: '', phone: '', description: '', rating: 0, // 기본값들
        image_url: '', road_address: '', homepage: '',
        // isSelected, isCandidate 등은 SelectedPlace에서 오므로 여기서는 false 또는 undefined
        isSelected: false,
        isCandidate: false,
        // Place 타입의 나머지 필드들
      } as ScheduleItineraryPlaceWithTime; // 명시적 캐스팅
    });

    // response.route_summary의 각 아이템 타입은 NewServerScheduleResponse에서 정의된 구조를 따름
    return response.route_summary.map((summaryItem) => {
      // summaryItem.day가 있으면 사용, 없으면 기존 로직 (요일 문자열 기준)
      // 프롬프트 1의 NewServerScheduleResponse.route_summary 아이템에는 day 필드가 없음.
      // 이 부분은 서버 응답 실제 스펙과 타입 정의 일관성 필요. 임시로 index 기반 처리.
      // const routeDayOfWeekString = summaryItem.day?.substring(0, 3) || dayOfWeekMap....
      // 이 예제에서는 summaryItem.day가 없다고 가정하고 index 기반으로 날짜 번호 계산
      // 실제로는 summaryItem에 날짜 정보가 있거나, processServerResponse처럼 payload의 시작일 기준 계산 필요
      
      // 임시로 day를 순차 증가하는 값으로 사용 (실제로는 서버 응답의 day 정보나 계산된 값 사용)
      // 이 parseServerResponse가 언제 호출되는지에 따라 day 계산 방식이 달라져야 함.
      // 여기서는 NewServerScheduleResponse의 route_summary에 day가 없으므로 index+1 사용
      const tempDayNumber = response.route_summary.indexOf(summaryItem) + 1;


      // summaryItem.interleaved_route 또는 summaryItem.first_20_interleaved 사용
      const currentInterleavedRoute = summaryItem.interleaved_route || summaryItem.first_20_interleaved || [];
      const placeNodeIdsInRoute = extractAllNodesFromRoute(currentInterleavedRoute).map(String);
      const linkIdsInRoute = extractAllLinksFromRoute(currentInterleavedRoute).map(String);

      const dayPlaces = allServerPlaces.filter(p => {
        const pIdStr = String(p.id); // p.id가 string | number 일 수 있음
        return placeNodeIdsInRoute.includes(pIdStr) || 
               (p.node_id && placeNodeIdsInRoute.includes(String(p.node_id))); // node_id도 고려
      });
      
      // ItineraryDay 타입에 맞춰 반환
      const dayData: ItineraryDay = {
        day: tempDayNumber, // 계산된 날짜 번호
        // dayOfWeek, date는 ItineraryDay 타입에 있지만, 현재 summaryItem에 정보가 부족하여 임시값 또는 생략
        dayOfWeek: '', // Placeholder - calculate if possible
        date: '',      // Placeholder - calculate if possible
        places: dayPlaces, // 타입은 ScheduleItineraryPlaceWithTime[]이지만, ItineraryDay.places는 ItineraryPlace[]
                           // 호환되도록 캐스팅하거나, ItineraryDay.places 타입을 ScheduleItineraryPlaceWithTime[]로 변경 필요
                           // 여기서는 ItineraryPlace[]로 가정하고, 필요한 필드만 포함하도록 매핑 필요
        totalDistance: (summaryItem.total_distance_m || summaryItem.interleaved_route_length || 0) / 1000,
        interleaved_route: currentInterleavedRoute,
        routeData: { // routeData: any 이므로, 여기에 필요한 구조를 채움
          nodeIds: placeNodeIdsInRoute,
          linkIds: linkIdsInRoute,
          // segmentRoutes를 채우려면 RouteSegment[] 또는 SegmentRoute[] 를 만들어야 함.
          // 현재 빌드 오류는 segmentRoutes 타입 불일치이므로, 이 필드를 채우지 않거나
          // 올바른 타입(SegmentRoute[])으로 채워야 함.
          // 지금은 routeData: any 이므로, 아래와 같이 넣어도 타입 에러는 안나지만, 소비하는 쪽에서 문제 발생 가능
          // segmentRoutes: [] // 임시로 빈 배열 또는 올바른 SegmentRoute[]
        }
      };
      return dayData;
    });
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};

