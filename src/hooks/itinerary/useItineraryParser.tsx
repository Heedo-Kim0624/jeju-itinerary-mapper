import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload, SchedulePlace } from '@/types/schedule'; // Added SchedulePlace
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace, Place } from '@/types/core';
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems'; // Keep if used for grouping

// --- Helper Function Stubs (as definitions were not provided) ---
const mapServerTypeToCategory = (serverType: string): string => {
  // Basic mapping, expand as needed
  if (serverType === 'attraction') return '관광지';
  if (serverType === 'restaurant') return '음식점';
  if (serverType === 'cafe') return '카페';
  if (serverType === 'accommodation') return '숙소';
  return '기타'; // Default category
};

const extractTimeFromTimeBlock = (timeBlock: string): string => {
  // Assumes timeBlock is like "Mon_0900" or "0900"
  const parts = timeBlock.split('_');
  const timeStr = parts.length > 1 ? parts[1] : parts[0];
  if (timeStr && timeStr.length === 4) {
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
  }
  return "00:00"; // Fallback
};

const calculateDepartTime = (arriveTime: string, stayDurationMinutes: number): string => {
  if (!arriveTime || !arriveTime.includes(':')) return "00:00";
  const [hours, minutes] = arriveTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + stayDurationMinutes);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};
// --- End Helper Function Stubs ---

// Adapted from user's prompt
const processServerScheduleItem = (
  serverItem: ServerScheduleItem,
  itemIndex: number, 
  dayNumber: number, 
  totalPlacesInDay: number,
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: CoreSelectedPlace[]
): ItineraryPlaceWithTime => {
  let placeId: string | number | null = null;
  // Correctly type matchedPayloadPlace as SchedulePlace from the payload
  let matchedPayloadPlace: SchedulePlace | undefined = undefined; 

  if (lastPayload) {
    const allPayloadPlaces = [...(lastPayload.selected_places || []), ...(lastPayload.candidate_places || [])];
    if (serverItem.id) {
        matchedPayloadPlace = allPayloadPlaces.find(p => String(p.id) === String(serverItem.id));
        if (matchedPayloadPlace) placeId = matchedPayloadPlace.id;
    }
    if (!matchedPayloadPlace && serverItem.place_name) { 
        matchedPayloadPlace = allPayloadPlaces.find(p => p.name === serverItem.place_name);
        if (matchedPayloadPlace) placeId = matchedPayloadPlace.id;
    }
    
    if (matchedPayloadPlace) {
      console.log(`[useItineraryParser] Matched server place "${serverItem.place_name}" with payload place ID: ${placeId}`);
    }
  }

  const isAirport = serverItem.place_name === "제주국제공항" ||
                    (serverItem.place_name && serverItem.place_name.includes("제주공항")) || // Check for null place_name
                    (serverItem.place_name && serverItem.place_name.includes("제주 국제공항"));

  if (isAirport) {
    const isFirstOrLastPlace = (itemIndex === 0 || itemIndex === totalPlacesInDay - 1);
    if (isFirstOrLastPlace) {
      console.log(`[useItineraryParser] Applying fixed coordinates for Jeju International Airport as first/last place of day ${dayNumber}.`);
      return {
        id: String(placeId || `airport_${itemIndex}_${dayNumber}`),
        name: "제주국제공항",
        category: "교통", 
        x: 126.4891647,
        y: 33.510418,
        address: "제주특별자치도 제주시 공항로 2",
        road_address: "제주특별자치도 제주시 공항로 2",
        phone: "064-797-2114",
        description: "제주도의 관문 국제공항",
        rating: 4.0, 
        image_url: "", 
        homepage: "https://www.airport.co.kr/jeju/",
        timeBlock: serverItem.time_block,
        arriveTime: extractTimeFromTimeBlock(serverItem.time_block),
        // Use default 60 min stay, as stay_time_minutes is not on ServerScheduleItem
        departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60), 
        stayDuration: 60,
        travelTimeToNext: "N/A", 
        isFallback: false, 
      };
    }
  }

  let placeDetails: CoreSelectedPlace | undefined = undefined;
  if (placeId) {
    placeDetails = currentSelectedPlaces.find(p => String(p.id) === String(placeId));
  }


  if (placeDetails) {
    return {
      id: String(placeDetails.id),
      name: placeDetails.name,
      category: placeDetails.category || mapServerTypeToCategory(serverItem.place_type || '기타'),
      x: placeDetails.x,
      y: placeDetails.y,
      address: placeDetails.address,
      road_address: placeDetails.road_address || placeDetails.address,
      phone: placeDetails.phone || 'N/A',
      description: placeDetails.description || '',
      rating: placeDetails.rating || 0,
      image_url: placeDetails.image_url || '',
      homepage: placeDetails.homepage || '',
      timeBlock: serverItem.time_block,
      arriveTime: extractTimeFromTimeBlock(serverItem.time_block),
      // Use default 60 min stay
      departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60),
      stayDuration: 60,
      travelTimeToNext: "15분", 
      isFallback: false,
      geoNodeId: placeDetails.geoNodeId, 
    };
  }

  console.warn(`[useItineraryParser] 장소 "${serverItem.place_name}"에 대한 상세 정보를 찾을 수 없습니다. 기본값을 사용합니다.`);
  return {
    id: String(serverItem.id || `fallback_${(serverItem.place_name || 'unknown').replace(/\s+/g, '_')}_${itemIndex}_${dayNumber}`),
    name: serverItem.place_name || '정보 없음',
    category: mapServerTypeToCategory(serverItem.place_type || '기타'),
    x: 126.5, 
    y: 33.4,  
    address: '제주특별자치도 (정보 부족)',
    road_address: '제주특별자치도 (정보 부족)',
    phone: 'N/A',
    description: '상세 정보 없음',
    rating: 0,
    image_url: '',
    homepage: '',
    timeBlock: serverItem.time_block,
    arriveTime: extractTimeFromTimeBlock(serverItem.time_block),
    // Use default 60 min stay
    departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60),
    stayDuration: 60,
    travelTimeToNext: "15분", 
    isFallback: true,
  };
};


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
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null 
  ): ItineraryDay[] => {
    console.log('[useItineraryParser] 서버 응답 파싱 시작:', {
      schedule_items: serverResponse.schedule?.length || 0,
      route_summary_items: serverResponse.route_summary?.length || 0,
      currentSelectedPlacesCount: currentSelectedPlaces.length,
      tripStartDate,
      hasLastPayload: !!lastPayload,
    });

    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      return [];
    }

    const scheduleByDay = new Map<string, ServerScheduleItem[]>();
    serverResponse.schedule.forEach(item => {
      const dayKey = item.time_block.split('_')[0]; 
      if (!scheduleByDay.has(dayKey)) {
        scheduleByDay.set(dayKey, []);
      }
      scheduleByDay.get(dayKey)?.push(item);
    });

    const routeByDay = new Map<string, any>();
    serverResponse.route_summary.forEach(route => {
      routeByDay.set(route.day, route); 
    });

    const dayMapping: Record<string, number> = {};
    const sortedDayKeys = [...scheduleByDay.keys()].sort((a, b) => {
      const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
      return (dayOrder[a as keyof typeof dayOrder] || 8) - (dayOrder[b as keyof typeof dayOrder] || 8);
    });
    
    sortedDayKeys.forEach((dayKey, index) => {
      dayMapping[dayKey] = index + 1; 
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    const result: ItineraryDay[] = sortedDayKeys.map((dayOfWeekKey) => {
      const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
      const routeInfo = routeByDay.get(dayOfWeekKey); 
      const dayNumber = dayMapping[dayOfWeekKey];
      
      const places: ItineraryPlaceWithTime[] = dayItemsOriginal.map((item, itemIndex) => {
        return processServerScheduleItem(
          item,
          itemIndex,
          dayNumber,
          dayItemsOriginal.length,
          lastPayload,
          currentSelectedPlaces
        );
      });

      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string) => { 
          const idStr = String(id);
          interleaved_route.push(idStr); 
          // This logic might need refinement based on actual interleaved_route structure
          if (interleaved_route.length % 2 !== 0 || typeof id === 'string' && id.startsWith('N')) { // Simple heuristic
            nodeIds.push(idStr);
          } else {
            linkIds.push(idStr);
          }
        });
      }

      const totalDistance = routeInfo?.total_distance_m ? routeInfo.total_distance_m / 1000 : 0;

      return {
        day: dayNumber,
        dayOfWeek: dayOfWeekKey,
        date: formatDate(tripStartDate, dayNumber - 1),
        places: places,
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: routeInfo?.segment_routes || [] 
        },
        interleaved_route: interleaved_route // Store the processed interleaved_route
      };
    });
    
    const totalPlaces = result.reduce((sum, day) => sum + day.places.length, 0);
    const placesWithDefaultCoords = result.reduce((sum, day) => 
      sum + day.places.filter(p => p.isFallback && p.x === 126.5 && p.y === 33.4).length, 0
    );
    
    console.log('[useItineraryParser] 파싱 완료된 일정:', {
      일수: result.length,
      각일자별장소수: result.map(day => day.places.length),
      총장소수: totalPlaces,
      기본값사용장소수: placesWithDefaultCoords,
    });

    if (placesWithDefaultCoords > 0) {
      console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표 및 정보를 사용합니다. 상세 정보 매칭에 실패했을 수 있습니다.`);
    }
    return result;
  }, []);

  return { parseServerResponse };
};
