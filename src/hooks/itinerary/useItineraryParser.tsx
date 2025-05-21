
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem } from '@/types/schedule'; // ServerScheduleItem is also in core
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace } from '@/types/core';
// findMostSimilarString is used by placeDetailFinder, so not directly needed here anymore.
// import { findMostSimilarString } from '@/utils/stringUtils'; 
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';
import { findPlaceDetails } from './parser-utils/placeDetailFinder';
import { mapToItineraryPlace } from './parser-utils/itineraryPlaceMapper';

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
      mappedPlaceById.set(String(place.id), place); // Ensure ID is string for map key consistency
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
      dayMapping[day] = index + 1; // 1-based day number
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    const result: ItineraryDay[] = days.map((dayOfWeek, dayIndex) => { // dayIndex is 0-based
      const dayItemsOriginal = scheduleByDay.get(dayOfWeek) || [];
      const routeInfo = routeByDay.get(dayOfWeek);
      const dayNumber = dayMapping[dayOfWeek]; // 1-based day number for display and date calculation

      const mergedDayItems = mergeScheduleItems(dayItemsOriginal);
      
      const places: ItineraryPlaceWithTime[] = mergedDayItems.map((group, placeItemIndex) => {
        const selectedPlace = findPlaceDetails(
          group.item,
          mappedPlaceById,
          mappedPlaceByName
        );
        
        return mapToItineraryPlace(
          group,
          selectedPlace,
          dayIndex, // Pass 0-based dayIndex for unique ID generation consistency
          placeItemIndex
        );
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
        date: formatDate(tripStartDate, dayNumber - 1), // dayNumber is 1-based, offset needs to be adjusted if tripStartDate is day 0
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
