import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace } from '@/types/core';
import { findMostSimilarString } from '@/utils/stringUtils';

export const useItineraryParser = () => {
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
    tripStartDate: Date | null = null
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

    const mappedPlaceById = new Map<string, CoreSelectedPlace>();
    const mappedPlaceByName = new Map<string, CoreSelectedPlace>();
    
    currentSelectedPlaces.forEach(place => {
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
      const dayItemsOriginal = scheduleByDay.get(dayOfWeek) || [];
      const routeInfo = routeByDay.get(dayOfWeek);
      const dayNumber = dayMapping[dayOfWeek];

      // Group consecutive identical places
      const mergedDayItems: { item: ServerScheduleItem, count: number }[] = [];
      if (dayItemsOriginal.length > 0) {
        let currentGroup = { item: dayItemsOriginal[0], count: 1 };
        for (let i = 1; i < dayItemsOriginal.length; i++) {
          if (dayItemsOriginal[i].id === currentGroup.item.id && dayItemsOriginal[i].place_name === currentGroup.item.place_name) {
            currentGroup.count++;
          } else {
            mergedDayItems.push(currentGroup);
            currentGroup = { item: dayItemsOriginal[i], count: 1 };
          }
        }
        mergedDayItems.push(currentGroup); // Add the last group
      }
      
      const places: ItineraryPlaceWithTime[] = mergedDayItems.map((group, placeItemIndex) => {
        const item = group.item; // Use the first item of the group for basic info
        const stayDurationInMinutes = group.count * 60; // Assuming each item in schedule is 1 hour

        const timeBlock = item.time_block.split('_')[1];
        const arriveHour = timeBlock.substring(0, 2);
        const arriveMinute = timeBlock.substring(2, 4);
        const formattedArriveTime = `${arriveHour}:${arriveMinute}`;

        let departHourCalc = parseInt(arriveHour, 10);
        let departMinuteCalc = parseInt(arriveMinute, 10);
        departMinuteCalc += stayDurationInMinutes;
        departHourCalc += Math.floor(departMinuteCalc / 60);
        departMinuteCalc %= 60;
        departHourCalc %= 24;
        const formattedDepartTime = `${departHourCalc.toString().padStart(2, '0')}:${departMinuteCalc.toString().padStart(2, '0')}`;

        let selectedPlace: CoreSelectedPlace | undefined = undefined;
        const serverPlaceIdStr = item.id !== undefined ? String(item.id) : undefined;

        if (serverPlaceIdStr) {
          selectedPlace = mappedPlaceById.get(serverPlaceIdStr);
        }
        if (!selectedPlace) {
          selectedPlace = mappedPlaceByName.get(item.place_name);
        }
        if (!selectedPlace) {
          const nameWithoutSpaces = item.place_name.replace(/\s+/g, '');
          selectedPlace = mappedPlaceByName.get(nameWithoutSpaces);
        }
        if (!selectedPlace) {
          const candidateNames = Array.from(mappedPlaceByName.keys());
          const similarMatch = findMostSimilarString(item.place_name, candidateNames);
          if (similarMatch.match) {
            selectedPlace = mappedPlaceByName.get(similarMatch.match);
            console.log(`[useItineraryParser] "${item.place_name}" (ID: ${serverPlaceIdStr || 'N/A'})을(를) 유사도 ${similarMatch.similarity.toFixed(2)}로 "${similarMatch.match}"와(과) 매칭했습니다.`);
          }
        }
        
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
          category: item.place_type,
          timeBlock: formattedArriveTime, // Use arriveTime for timeBlock
          arriveTime: formattedArriveTime,
          departTime: formattedDepartTime, 
          stayDuration: stayDurationInMinutes,
          travelTimeToNext: '', // This would typically be calculated based on routeInfo if available for segments
          x: selectedPlace?.x || 126.5312,
          y: selectedPlace?.y || 33.4996,
          address: selectedPlace?.address || '정보 없음',
          road_address: selectedPlace?.road_address || '',
          phone: selectedPlace?.phone || '',
          description: selectedPlace?.description || '',
          rating: selectedPlace?.rating || 0,
          image_url: selectedPlace?.image_url || '',
          homepage: selectedPlace?.homepage || '',
          geoNodeId: placeIdForItinerary,
        };
        return place;
      });

      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string, index: number) => { 
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
        date: formatDate(tripStartDate, dayNumber - 1),
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
  }, []);

  return { parseServerResponse };
};
