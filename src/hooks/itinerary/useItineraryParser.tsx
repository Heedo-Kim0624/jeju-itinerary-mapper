
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem } from '@/types/schedule'; // ServerScheduleItem 추가
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace } from '@/types/core';
import { findMostSimilarString } from '@/utils/stringUtils'; // 새로 추가된 유틸리티

export const useItineraryParser = () => {
  // formatDate 유틸리티 함수 (기존 로직 유지)
  const formatDate = (baseDate: Date | null, dayOffset: number): string => {
    if (!baseDate) {
      const today = new Date();
      const targetDate = new Date(today);
      targetDate.setDate(today.getDate() + dayOffset);
      return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
    }
    
    const targetDate = new Date(baseDate);
    targetDate.setDate(baseDate.getDate() + dayOffset);
    return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
  };

  const parseServerResponse = useCallback((
    serverResponse: NewServerScheduleResponse,
    currentSelectedPlaces: CoreSelectedPlace[] = [],
    tripStartDate: Date | null = null // tripStartDate 파라미터 유지
  ): ItineraryDay[] => {
    console.log('[useItineraryParser] 서버 응답 파싱 시작:', {
      schedule_items: serverResponse.schedule?.length || 0,
      route_summary_items: serverResponse.route_summary?.length || 0,
      currentSelectedPlacesCount: currentSelectedPlaces.length,
      tripStartDate,
    });

    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      return [];
    }

    // 장소 ID(string) 및 이름 기반 매핑 생성
    const mappedPlaceById = new Map<string, CoreSelectedPlace>();
    const mappedPlaceByName = new Map<string, CoreSelectedPlace>();
    
    currentSelectedPlaces.forEach(place => {
      // CoreSelectedPlace.id는 이미 string이므로 String() 불필요
      mappedPlaceById.set(place.id, place);
      
      mappedPlaceByName.set(place.name, place);
      const nameWithoutSpaces = place.name.replace(/\s+/g, '');
      if (nameWithoutSpaces !== place.name) {
        mappedPlaceByName.set(nameWithoutSpaces, place);
      }
    });

    console.log('[useItineraryParser] 장소 매핑 생성 완료:', {
      id_기반_매핑_개수: mappedPlaceById.size,
      이름_기반_매핑_개수: mappedPlaceByName.size
    });

    const scheduleByDay = new Map<string, ServerScheduleItem[]>();
    serverResponse.schedule.forEach(item => {
      const day = item.time_block.split('_')[0];
      if (!scheduleByDay.has(day)) {
        scheduleByDay.set(day, []);
      }
      scheduleByDay.get(day)?.push(item);
    });

    console.log('[useItineraryParser] 요일별 일정 그룹화 결과:', 
      Object.fromEntries([...scheduleByDay.entries()].map(([day, items]) => [day, items.length]))
    );

    const routeByDay = new Map<string, any>();
    serverResponse.route_summary.forEach(route => {
      routeByDay.set(route.day, route);
    });

    const dayMapping: Record<string, number> = {};
    const days = [...scheduleByDay.keys()].sort((a, b) => {
      const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
      return (dayOrder[a as keyof typeof dayOrder] || 0) - (dayOrder[b as keyof typeof dayOrder] || 0);
    });
    days.forEach((day, index) => {
      dayMapping[day] = index + 1;
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    const result: ItineraryDay[] = days.map((dayOfWeek, dayIndex) => {
      const dayItems = scheduleByDay.get(dayOfWeek) || [];
      const routeInfo = routeByDay.get(dayOfWeek);
      const dayNumber = dayMapping[dayOfWeek];

      const places: ItineraryPlaceWithTime[] = dayItems.map((item, placeItemIndex) => {
        const timeBlock = item.time_block.split('_')[1];
        const hour = timeBlock.substring(0, 2);
        const minute = timeBlock.substring(2, 4);
        const formattedTime = `${hour}:${minute}`;

        let selectedPlace: CoreSelectedPlace | undefined = undefined;
        const serverPlaceIdStr = item.id !== undefined ? String(item.id) : undefined;

        // 1. 서버에서 제공된 ID로 장소 찾기
        if (serverPlaceIdStr) {
          selectedPlace = mappedPlaceById.get(serverPlaceIdStr);
        }
        
        // 2. ID로 못 찾았으면, 정확한 이름으로 찾기
        if (!selectedPlace) {
          selectedPlace = mappedPlaceByName.get(item.place_name);
        }
        
        // 3. 공백 제거한 이름으로 찾기
        if (!selectedPlace) {
          const nameWithoutSpaces = item.place_name.replace(/\s+/g, '');
          selectedPlace = mappedPlaceByName.get(nameWithoutSpaces);
        }

        // 4. 유사한 이름으로 찾기
        if (!selectedPlace) {
          const candidateNames = Array.from(mappedPlaceByName.keys());
          const similarMatch = findMostSimilarString(item.place_name, candidateNames);
          if (similarMatch.match) {
            selectedPlace = mappedPlaceByName.get(similarMatch.match);
            console.log(`[useItineraryParser] "${item.place_name}" (ID: ${serverPlaceIdStr || 'N/A'})을(를) 유사도 ${similarMatch.similarity.toFixed(2)}로 "${similarMatch.match}"와(과) 매칭했습니다.`);
          }
        }
        
        // ItineraryPlaceWithTime 객체의 ID 생성
        // 서버 item.id가 있으면 사용, 없으면 place_name과 인덱스 기반으로 생성
        const placeIdForItinerary: string = serverPlaceIdStr 
          ? serverPlaceIdStr 
          : `fallback_${item.place_name.replace(/\s+/g, "_")}_${dayIndex}_${placeItemIndex}`;

        if (item.id === undefined) {
             console.warn(`[useItineraryParser] 서버 항목 "${item.place_name}"에 ID가 없습니다. 대체 ID "${placeIdForItinerary}"를 사용합니다.`);
        }

        if (!selectedPlace) {
          console.warn(`[useItineraryParser] 장소 "${item.place_name}" (서버ID: ${serverPlaceIdStr || 'N/A'}, 최종ID: ${placeIdForItinerary})의 상세 정보를 로컬 선택 목록에서 찾을 수 없습니다. 기본값을 사용합니다.`);
        }

        const place: ItineraryPlaceWithTime = {
          id: placeIdForItinerary,
          name: item.place_name,
          category: item.place_type, // 서버에서 제공하는 place_type 사용
          timeBlock: formattedTime,
          arriveTime: formattedTime,
          departTime: '', 
          stayDuration: 60,
          travelTimeToNext: '',
          x: selectedPlace?.x || 126.5312, // 제주 시청 좌표 근처
          y: selectedPlace?.y || 33.4996,  // 제주 시청 좌표 근처
          address: selectedPlace?.address || '정보 없음',
          road_address: selectedPlace?.road_address || '',
          phone: selectedPlace?.phone || '',
          description: selectedPlace?.description || '',
          rating: selectedPlace?.rating || 0,
          image_url: selectedPlace?.image_url || '',
          homepage: selectedPlace?.homepage || '',
          geoNodeId: placeIdForItinerary, // 일관성을 위해 itinerary id와 동일하게 설정
          // CoreSelectedPlace의 isSelected, isCandidate 등은 ItineraryPlaceWithTime에 직접 매핑하지 않음
        };
        return place;
      });

      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string, index: number) => { // 서버 응답 타입이 number | string 일 수 있음
          const idStr = String(id);
          interleaved_route.push(idStr);
          if (index % 2 === 0) {
            nodeIds.push(idStr);
          } else {
            linkIds.push(idStr);
          }
        });
      }

      const totalDistance = routeInfo ? routeInfo.total_distance_m / 1000 : 0;

      const itineraryDay: ItineraryDay = {
        day: dayNumber,
        dayOfWeek: dayOfWeek,
        date: formatDate(tripStartDate, dayNumber - 1), // tripStartDate와 formatDate 사용 유지
        places: places,
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: []
        },
        interleaved_route: interleaved_route
      };
      return itineraryDay;
    });

    const totalPlaces = result.reduce((sum, day) => sum + day.places.length, 0);
    const placesWithDefaultCoords = result.reduce((sum, day) => 
      sum + day.places.filter(p => p.x === 126.5312 && p.y === 33.4996).length, 0
    );
    
    console.log('[useItineraryParser] 파싱 완료된 일정:', {
      일수: result.length,
      각일자별장소수: result.map(day => day.places.length),
      총장소수: totalPlaces,
      기본좌표사용장소수: placesWithDefaultCoords,
    });

    if (placesWithDefaultCoords > 0) {
      console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표를 사용합니다. 상세 정보 매칭 실패 가능성이 있습니다.`);
    }

    return result;
  }, []); // formatDate는 useCallback의 의존성 배열에 포함될 필요 없음 (훅 스코프 내에서 안정적이므로)

  return { parseServerResponse };
};
