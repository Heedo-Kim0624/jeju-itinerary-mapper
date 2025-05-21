
import { useCallback } from 'react';
import { NewServerScheduleResponse } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { SelectedPlace as CoreSelectedPlace } from '@/types/core';

export const useItineraryParser = () => {
  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    selectedPlaces: CoreSelectedPlace[] = [],
    tripStartDate: Date | null = null
  ): ItineraryDay[] => {
    console.log('[useItineraryParser] 서버 응답 파싱 시작:', {
      schedule_items: serverResponse.schedule?.length || 0,
      route_summary_items: serverResponse.route_summary?.length || 0
    });

    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터가 없습니다:', serverResponse);
      return [];
    }

    // 장소 ID별 선택된 장소 정보 매핑 (좌표 정보 등 활용을 위해)
    const mappedPlaceIdByName = new Map<string, CoreSelectedPlace>();
    selectedPlaces.forEach(place => {
      mappedPlaceIdByName.set(place.name, place);
    });

    // 요일별 일정 그룹화
    const scheduleByDay = new Map<string, any[]>();
    serverResponse.schedule.forEach(item => {
      const day = item.time_block.split('_')[0]; // 'Tue_0900' -> 'Tue'
      if (!scheduleByDay.has(day)) {
        scheduleByDay.set(day, []);
      }
      scheduleByDay.get(day)?.push(item);
    });

    console.log('[useItineraryParser] 요일별 일정 그룹화 결과:', 
      Object.fromEntries([...scheduleByDay.entries()].map(([day, items]) => [day, items.length]))
    );

    // 요일별 경로 정보 매핑
    const routeByDay = new Map<string, any>();
    serverResponse.route_summary.forEach(route => {
      routeByDay.set(route.day, route);
    });

    // 요일 -> 일차 매핑 (Tue -> 1, Wed -> 2, ...)
    const dayMapping: Record<string, number> = {};
    const days = [...scheduleByDay.keys()].sort((a, b) => {
      const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
      return (dayOrder[a as keyof typeof dayOrder] || 0) - (dayOrder[b as keyof typeof dayOrder] || 0);
    });
    days.forEach((day, index) => {
      dayMapping[day] = index + 1;
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    // 날짜 포맷 유틸리티 함수
    const formatDate = (baseDate: Date | null, dayOffset: number): string => {
      if (!baseDate) {
        // 기준 날짜가 없으면 현재 날짜에서 시작
        const today = new Date();
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + dayOffset);
        return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
      }
      
      const targetDate = new Date(baseDate);
      targetDate.setDate(baseDate.getDate() + dayOffset);
      return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
    };

    // ItineraryDay[] 생성
    const result: ItineraryDay[] = days.map(dayOfWeek => {
      const dayItems = scheduleByDay.get(dayOfWeek) || [];
      const routeInfo = routeByDay.get(dayOfWeek);
      const dayNumber = dayMapping[dayOfWeek];

      // 해당 일자의 장소 목록 생성
      const places: ItineraryPlaceWithTime[] = dayItems.map(item => {
        const timeBlock = item.time_block.split('_')[1]; // 'Tue_0900' -> '0900'
        const hour = timeBlock.substring(0, 2);
        const minute = timeBlock.substring(2, 4);
        const formattedTime = `${hour}:${minute}`;

        // 장소 이름으로 선택된 장소 정보 찾기 (좌표 등)
        const selectedPlace = mappedPlaceIdByName.get(item.place_name);
        
        if (!selectedPlace) {
          console.warn(`[useItineraryParser] "${item.place_name}" 장소의 상세 정보를 찾을 수 없습니다.`);
        }

        // ItineraryPlaceWithTime 객체 생성
        const place: ItineraryPlaceWithTime = {
          id: String(item.id || ''), // NODE_ID를 문자열로 변환
          name: item.place_name,
          category: item.place_type,
          timeBlock: formattedTime,
          arriveTime: formattedTime,
          departTime: '', // 필요시 계산
          stayDuration: 60, // 기본값
          travelTimeToNext: '', // 필요시 계산
          // 선택된 장소에서 추가 정보 가져오기
          x: selectedPlace?.x || 0,
          y: selectedPlace?.y || 0,
          address: selectedPlace?.address || '',
          road_address: selectedPlace?.road_address || '',
          phone: selectedPlace?.phone || '',
          description: selectedPlace?.description || '',
          rating: selectedPlace?.rating || 0,
          image_url: selectedPlace?.image_url || '',
          homepage: selectedPlace?.homepage || '',
          geoNodeId: String(item.id || ''), // NODE_ID를 geoNodeId로 사용
        };

        return place;
      });

      // 경로 데이터 추출
      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string, index: number) => {
          const idStr = String(id);
          interleaved_route.push(idStr);
          
          // 짝수 인덱스는 NODE_ID, 홀수 인덱스는 LINK_ID
          if (index % 2 === 0) {
            nodeIds.push(idStr);
          } else {
            linkIds.push(idStr);
          }
        });
      }

      // 총 이동 거리 계산 (미터 -> 킬로미터)
      const totalDistance = routeInfo ? routeInfo.total_distance_m / 1000 : 0;

      // ItineraryDay 객체 생성
      const itineraryDay: ItineraryDay = {
        day: dayNumber,
        dayOfWeek: dayOfWeek,
        date: formatDate(tripStartDate, dayNumber - 1), // 시작 날짜 기준으로 날짜 설정
        places: places,
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: [] // 필요시 계산
        },
        interleaved_route: interleaved_route
      };

      return itineraryDay;
    });

    console.log('[useItineraryParser] 파싱 완료된 일정:', {
      일수: result.length,
      각일자별장소수: result.map(day => day.places.length),
      총장소수: result.reduce((sum, day) => sum + day.places.length, 0)
    });

    return result;
  }, []);

  return { parseServerResponse };
};
