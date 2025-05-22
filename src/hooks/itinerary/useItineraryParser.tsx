import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload } from '@/types/schedule';
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
  itemIndex: number, // index of the item within its day
  dayNumber: number, // 1-based day number
  totalPlacesInDay: number, // total number of places for this day
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: CoreSelectedPlace[]
): ItineraryPlaceWithTime => {
  let placeId: string | number | null = null;
  let matchedPayloadPlace: Place | CoreSelectedPlace | undefined = undefined;

  if (lastPayload) {
    const allPayloadPlaces = [...(lastPayload.selected_places || []), ...(lastPayload.candidate_places || [])];
    // Server might return just name, or name + ID. We prioritize ID from serverItem if available.
    // If serverItem.id exists, use that. Otherwise, match by name.
    if (serverItem.id) {
        matchedPayloadPlace = allPayloadPlaces.find(p => String(p.id) === String(serverItem.id));
        if (matchedPayloadPlace) placeId = matchedPayloadPlace.id;
    }
    if (!matchedPayloadPlace) { // If no match by serverItem.id or serverItem.id is missing
        matchedPayloadPlace = allPayloadPlaces.find(p => p.name === serverItem.place_name);
        if (matchedPayloadPlace) placeId = matchedPayloadPlace.id;
    }
    
    if (matchedPayloadPlace) {
      console.log(`[useItineraryParser] Matched server place "${serverItem.place_name}" with payload place ID: ${placeId}`);
    }
  }

  const isAirport = serverItem.place_name === "제주국제공항" ||
                    serverItem.place_name.includes("제주공항") ||
                    serverItem.place_name.includes("제주 국제공항");

  if (isAirport) {
    const isFirstOrLastPlace = (itemIndex === 0 || itemIndex === totalPlacesInDay - 1);
    if (isFirstOrLastPlace) {
      console.log(`[useItineraryParser] Applying fixed coordinates for Jeju International Airport as first/last place of day ${dayNumber}.`);
      return {
        id: String(placeId || `airport_${itemIndex}_${dayNumber}`),
        name: "제주국제공항",
        category: "교통", // More specific category
        x: 126.4891647,
        y: 33.510418,
        address: "제주특별자치도 제주시 공항로 2",
        road_address: "제주특별자치도 제주시 공항로 2",
        phone: "064-797-2114",
        description: "제주도의 관문 국제공항",
        rating: 4.0, // Example rating
        image_url: "", // Placeholder
        homepage: "https://www.airport.co.kr/jeju/",
        timeBlock: serverItem.time_block,
        arriveTime: extractTimeFromTimeBlock(serverItem.time_block),
        departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60), // Default 60 min stay
        stayDuration: 60,
        travelTimeToNext: "N/A", // Usually no travel time from/to airport within scheduler context
        isFallback: false, // Not a fallback since it's explicitly handled
      };
    }
  }

  let placeDetails: CoreSelectedPlace | undefined = undefined;
  if (placeId) {
    // Find full details from currentSelectedPlaces using the ID derived from payload
    placeDetails = currentSelectedPlaces.find(p => String(p.id) === String(placeId));
  }


  if (placeDetails) {
    return {
      // Ensure all required fields for ItineraryPlaceWithTime are present
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
      departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), serverItem.stay_time_minutes || 60),
      stayDuration: serverItem.stay_time_minutes || 60,
      travelTimeToNext: "15분", // Placeholder
      isFallback: false,
      geoNodeId: placeDetails.geoNodeId, // Retain geoNodeId if present
    };
  }

  console.warn(`[useItineraryParser] 장소 "${serverItem.place_name}"에 대한 상세 정보를 찾을 수 없습니다. 기본값을 사용합니다.`);
  return {
    id: String(serverItem.id || `fallback_${serverItem.place_name.replace(/\s+/g, '_')}_${itemIndex}_${dayNumber}`),
    name: serverItem.place_name,
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
    departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), serverItem.stay_time_minutes || 60),
    stayDuration: serverItem.stay_time_minutes || 60,
    travelTimeToNext: "15분", // Placeholder
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
    currentSelectedPlaces: CoreSelectedPlace[] = [], // Already available
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null // New parameter
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

    // Removed mappedPlaceById and mappedPlaceByName as new logic uses lastPayload and currentSelectedPlaces directly

    const scheduleByDay = new Map<string, ServerScheduleItem[]>();
    serverResponse.schedule.forEach(item => {
      const dayKey = item.time_block.split('_')[0]; // e.g., "Mon", "Tue"
      if (!scheduleByDay.has(dayKey)) {
        scheduleByDay.set(dayKey, []);
      }
      scheduleByDay.get(dayKey)?.push(item);
    });

    const routeByDay = new Map<string, any>();
    serverResponse.route_summary.forEach(route => {
      routeByDay.set(route.day, route); // Assuming route_summary item has a 'day' property like "Mon", "Tue"
    });

    const dayMapping: Record<string, number> = {};
    // Ensure days are sorted chronologically if not already
    const sortedDayKeys = [...scheduleByDay.keys()].sort((a, b) => {
      const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
      return (dayOrder[a as keyof typeof dayOrder] || 8) - (dayOrder[b as keyof typeof dayOrder] || 8);
    });
    
    sortedDayKeys.forEach((dayKey, index) => {
      dayMapping[dayKey] = index + 1; // 1-based day number
    });

    console.log('[useItineraryParser] 요일 -> 일차 매핑:', dayMapping);

    const result: ItineraryDay[] = sortedDayKeys.map((dayOfWeekKey) => {
      const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
      const routeInfo = routeByDay.get(dayOfWeekKey); // Get route info by dayKey "Mon", "Tue" etc.
      const dayNumber = dayMapping[dayOfWeekKey]; // 1-based day number

      // mergeScheduleItems groups consecutive items for the same place.
      // If a place appears multiple times consecutively (e.g. for lunch and then a break),
      // it will be one group. `processServerScheduleItem` is designed for one server item.
      // So we iterate over original items, or if mergeScheduleItems is crucial,
      // adapt `processServerScheduleItem` to handle a group.
      // For now, let's iterate over original items.
      // const mergedDayItems = mergeScheduleItems(dayItemsOriginal);
      
      // Using dayItemsOriginal directly with the new processServerScheduleItem
      const places: ItineraryPlaceWithTime[] = dayItemsOriginal.map((item, itemIndex) => {
        return processServerScheduleItem(
          item,
          itemIndex,
          dayNumber,
          dayItemsOriginal.length, // total places for this day
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
          interleaved_route.push(idStr); // Keep original type if server sends mixed types and downstream handles it
          // This simple even/odd check for nodes/links might be too naive if interleaved_route is complex
          if (interleaved_route.length % 2 !== 0) { // Assuming nodes are at odd positions (1st, 3rd, ..)
            nodeIds.push(idStr);
          } else { // Assuming links are at even positions (2nd, 4th, ..)
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
          segmentRoutes: routeInfo?.segment_routes || [] // Assuming segment_routes might exist
        },
        interleaved_route: interleaved_route
      };
    });
    
    const totalPlaces = result.reduce((sum, day) => sum + day.places.length, 0);
    const placesWithDefaultCoords = result.reduce((sum, day) => 
      sum + day.places.filter(p => p.isFallback && p.x === 126.5 && p.y === 33.4).length, 0
    ); // check for fallback AND default coords
    
    console.log('[useItineraryParser] 파싱 완료된 일정:', {
      일수: result.length,
      각일자별장소수: result.map(day => day.places.length),
      총장소수: totalPlaces,
      기본값사용장소수: placesWithDefaultCoords, // Updated name
    });

    if (placesWithDefaultCoords > 0) {
      console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표 및 정보를 사용합니다. 상세 정보 매칭에 실패했을 수 있습니다.`);
    }
    return result;
  }, []);

  return { parseServerResponse };
};
