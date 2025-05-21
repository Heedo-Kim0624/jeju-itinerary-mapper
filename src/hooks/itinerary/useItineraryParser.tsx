
import { toast } from 'sonner';
import type { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace, NewServerScheduleResponse } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from './itineraryUtils'; // itineraryUtils에서 날짜/요일 포맷 함수 가져오기
import { addDays } from 'date-fns';


export const useItineraryParser = () => {
  const parseServerResponse = (
    serverResponse: NewServerScheduleResponse,
    currentSelectedPlaces: CoreSelectedPlace[] = [],
    tripStartDate: Date | null // 여행 시작 날짜 추가
  ): ItineraryDay[] => {
    console.log('[useItineraryParser] 서버 응답 파싱 시작:', {
      schedule_items: serverResponse?.schedule?.length || 0,
      route_summary_items: serverResponse?.route_summary?.length || 0,
      currentSelectedPlacesCount: currentSelectedPlaces.length,
      tripStartDate: tripStartDate?.toISOString()
    });

    if (!serverResponse || !serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      toast.error("서버 응답 형식이 올바르지 않습니다.");
      return [];
    }

    const mappedPlaceIdByName = new Map<string, CoreSelectedPlace>();
    currentSelectedPlaces.forEach(place => {
      if (place.name) { // place.name이 있는 경우에만 매핑
        mappedPlaceIdByName.set(place.name, place);
      }
    });

    const scheduleByDay = new Map<string, any[]>();
    serverResponse.schedule.forEach(item => {
      if (item.time_block && typeof item.time_block === 'string') {
        const day = item.time_block.split('_')[0]; // 'Tue_0900' -> 'Tue'
        if (!scheduleByDay.has(day)) {
          scheduleByDay.set(day, []);
        }
        scheduleByDay.get(day)?.push(item);
      } else {
        console.warn('[useItineraryParser] 유효하지 않은 time_block:', item);
      }
    });

    console.log('[useItineraryParser] 요일별 일정 그룹화 결과:', 
      Object.fromEntries([...scheduleByDay.entries()].map(([day, items]) => [day, items.length]))
    );

    const routeByDay = new Map<string, any>();
    serverResponse.route_summary.forEach(route => {
      routeByDay.set(route.day, route);
    });

    const dayOrderLookup: { [key: string]: number } = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
    const days = [...scheduleByDay.keys()].sort((a, b) => {
      return (dayOrderLookup[a] || 8) - (dayOrderLookup[b] || 8); // 정의되지 않은 요일은 뒤로
    });
    
    const dayMapping: Record<string, number> = {};
    days.forEach((day, index) => {
      dayMapping[day] = index + 1;
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    const result: ItineraryDay[] = days.map(dayOfWeekKey => {
      const dayItems = scheduleByDay.get(dayOfWeekKey) || [];
      const routeInfo = routeByDay.get(dayOfWeekKey);
      const dayNumber = dayMapping[dayOfWeekKey];

      const actualDate = tripStartDate ? addDays(tripStartDate, dayNumber -1) : new Date();
      const dateStr = getDateStringMMDD(actualDate);
      const dayOfWeekStr = getDayOfWeekString(actualDate);


      const places: ItineraryPlaceWithTime[] = dayItems.map(item => {
        const timeBlock = item.time_block.split('_')[1] || "0000"; 
        const hour = timeBlock.substring(0, 2);
        const minute = timeBlock.substring(2, 4);
        const formattedTime = `${hour}:${minute}`;
        
        const selectedPlace = item.place_name ? mappedPlaceIdByName.get(item.place_name) : undefined;
        
        if (!selectedPlace && item.place_name) {
          console.warn(`[useItineraryParser] "${item.place_name}" 장소의 상세 정보를 currentSelectedPlaces에서 찾을 수 없습니다. 서버 ID (${item.id})와 기본값을 사용합니다.`);
        }

        const place: ItineraryPlaceWithTime = {
          id: String(item.id), // 서버에서 온 id (NODE_ID일 가능성 높음)
          name: item.place_name || '이름 없는 장소',
          category: item.place_type || '기타',
          timeBlock: formattedTime,
          arriveTime: formattedTime, // 도착시간 우선 이걸로.
          departTime: '', // 추후 계산 필요
          stayDuration: item.stay_time_minutes || 60, // 서버에서 제공하면 사용, 아니면 기본값
          travelTimeToNext: item.travel_time_to_next_min ? `${item.travel_time_to_next_min}분` : '', // 서버 제공 값

          x: selectedPlace?.x ?? item.x ?? 0, // selectedPlace 우선, 없으면 item.x, 그것도 없으면 0
          y: selectedPlace?.y ?? item.y ?? 0, // selectedPlace 우선, 없으면 item.y, 그것도 없으면 0
          address: selectedPlace?.address || item.address || '',
          road_address: selectedPlace?.road_address || item.road_address || '',
          phone: selectedPlace?.phone || item.phone || '',
          description: selectedPlace?.description || item.description || '',
          rating: selectedPlace?.rating ?? (item.rating ? parseFloat(item.rating) : 0),
          image_url: selectedPlace?.image_url || item.image_url || '',
          homepage: selectedPlace?.homepage || item.homepage || '',
          geoNodeId: String(item.id), // 서버에서 온 ID를 geoNodeId로 사용
        };
        return place;
      });

      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route && Array.isArray(routeInfo.interleaved_route)) {
        routeInfo.interleaved_route.forEach((id: string | number, index: number) => {
          const idStr = String(id);
          interleaved_route.push(idStr);
          if (index % 2 === 0) {
            nodeIds.push(idStr);
          } else {
            linkIds.push(idStr);
          }
        });
      }

      const totalDistance = routeInfo?.total_distance_m ? parseFloat(String(routeInfo.total_distance_m)) / 1000 : 0;

      return {
        day: dayNumber,
        dayOfWeek: dayOfWeekStr, // 실제 요일 문자열
        date: dateStr,          // MM/DD 형식 날짜 문자열
        places: places,
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: [] 
        },
        interleaved_route: interleaved_route
      };
    });

    console.log('[useItineraryParser] 파싱 완료된 일정:', {
      일수: result.length,
      각일자별장소수: result.map(day => day.places.length),
      총장소수: result.reduce((sum, day) => sum + day.places.length, 0)
    });
    if (result.some(day => day.places.length === 0) && result.length > 0) {
        console.warn("[useItineraryParser] 일부 일자에 장소가 없습니다. 서버 응답 또는 매핑 로직을 확인하세요.", result.filter(day => day.places.length === 0).map(d => d.day));
    }


    return result;
  };

  return { parseServerResponse };
};

