import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload, SchedulePlace } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace, Place, CategoryName } from '@/types/core';
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';
import { parseIntId, isSameId } from '@/utils/id-utils';
import { mapCategoryNameToKey } from '@/utils/categoryColors'; // For default category mapping if needed

// --- Helper Function Stubs (as definitions were not provided) ---
const mapServerTypeToCategory = (serverType: string): string => {
  // Basic mapping, expand as needed
  if (serverType === 'attraction') return '관광지';
  if (serverType === 'restaurant') return '음식점';
  if (serverType === 'cafe') return '카페';
  if (serverType === 'accommodation') return '숙소';
  if (serverType === 'transportation') return '교통'; // 교통 추가
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

// Adapted from user's prompt and existing structure
const processServerScheduleItem = (
  serverItem: ServerScheduleItem,
  itemIndex: number, 
  dayNumber: number, 
  totalPlacesInDay: number,
  lastPayload: SchedulePayload | null, // lastSentPayload
  currentSelectedPlaces: CoreSelectedPlace[] // List of places with full details
): ItineraryPlaceWithTime => {
  
  console.group(`[PROCESS_SERVER_ITEM] 서버 항목 "${serverItem.place_name || '이름 없음'}" 처리 (${itemIndex}번째, ${dayNumber}일차)`);
  console.log('서버 항목 원본:', serverItem);

  let placeIdToMatch: string | number | null = serverItem.id; // Start with server item's ID
  let matchSource: string | null = 'server_item_id';
  
  // serverItem.id는 숫자일 수 있으므로 문자열로 변환하여 사용
  const serverItemIdStr = String(serverItem.id);


  if (lastPayload) {
    // 1. 서버 항목 ID (문자열) -> 페이로드 ID (문자열) 매칭
    const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverItemIdStr));
    if (foundInSelected) {
      placeIdToMatch = String(foundInSelected.id); // Ensure string
      matchSource = 'selected_places (ID 매칭)';
    }
    if (!foundInSelected) { // Check candidates only if not found in selected
      const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverItemIdStr));
      if (foundInCandidate) {
        placeIdToMatch = String(foundInCandidate.id); // Ensure string
        matchSource = 'candidate_places (ID 매칭)';
      }
    }

    // 2. ID 매칭 실패 시, 서버 항목 이름 -> 페이로드 이름 매칭
    if (matchSource === 'server_item_id' && serverItem.place_name) { // Only if not matched by ID from payload
      const foundInSelectedByName = lastPayload.selected_places?.find(p => p.name === serverItem.place_name);
      if (foundInSelectedByName) {
        placeIdToMatch = String(foundInSelectedByName.id); // Ensure string
        matchSource = 'selected_places (이름 매칭)';
      }
      if (!foundInSelectedByName) { // Check candidates by name
        const foundInCandidateByName = lastPayload.candidate_places?.find(p => p.name === serverItem.place_name);
        if (foundInCandidateByName) {
          placeIdToMatch = String(foundInCandidateByName.id); // Ensure string
          matchSource = 'candidate_places (이름 매칭)';
        }
      }
    }
    
    if (placeIdToMatch) {
      console.log(`장소 "${serverItem.place_name}" 매칭 ID: ${placeIdToMatch} (소스: ${matchSource})`);
    } else {
      console.warn(`장소 "${serverItem.place_name}"에 대한 ID를 페이로드에서 찾지 못했습니다. 서버 ID ${serverItemIdStr} 사용.`);
      placeIdToMatch = serverItemIdStr; // Fallback to original server ID as string
    }
  } else {
    console.warn('Last sent payload is null. Cannot match with payload. Using server ID.');
    placeIdToMatch = serverItemIdStr; // Fallback to original server ID as string
  }
  
  const placeNameLower = serverItem.place_name?.toLowerCase() || "";
  const isAirport = placeNameLower.includes("제주국제공항") || placeNameLower.includes("제주공항");

  if (isAirport) {
    const isFirstOrLastPlace = (itemIndex === 0 || itemIndex === totalPlacesInDay - 1);
    if (isFirstOrLastPlace) {
      console.log(`[useItineraryParser] Applying fixed coordinates for Jeju International Airport as first/last place of day ${dayNumber}.`);
      const airportResult: ItineraryPlaceWithTime = { // Explicitly type
        id: String(placeIdToMatch || `airport_${itemIndex}_${dayNumber}`), // Ensure string
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
        departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60), 
        stayDuration: 60,
        travelTimeToNext: "N/A", 
        isFallback: false, 
      };
      console.groupEnd();
      return airportResult;
    }
  }

  let placeDetails: CoreSelectedPlace | undefined = undefined;
  if (placeIdToMatch) {
    // currentSelectedPlaces에서 최종 ID로 상세 정보 찾기 (placeIdToMatch는 이미 string)
    placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, placeIdToMatch));
    if(placeDetails){
       console.log(`ID ${placeIdToMatch}로 currentSelectedPlaces에서 상세 정보 찾음:`, placeDetails.name);
    } else {
       console.warn(`ID ${placeIdToMatch}로 currentSelectedPlaces에서 상세 정보 찾지 못함.`);
    }
  }


  if (placeDetails) {
    const result: ItineraryPlaceWithTime = { // Explicitly type
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
      departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60),
      stayDuration: 60, 
      travelTimeToNext: "15분", 
      isFallback: false,
      geoNodeId: placeDetails.geoNodeId, 
    };
    console.groupEnd();
    return result;
  }

  console.warn(`[useItineraryParser] 장소 "${serverItem.place_name}"에 대한 상세 정보를 찾을 수 없습니다. 기본값을 사용합니다.`);
  const fallbackResult: ItineraryPlaceWithTime = { // Explicitly type
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
    departTime: calculateDepartTime(extractTimeFromTimeBlock(serverItem.time_block), 60),
    stayDuration: 60,
    travelTimeToNext: "15분", 
    isFallback: true,
  };
  console.groupEnd();
  return fallbackResult;
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
    lastPayload: SchedulePayload | null = null // lastPayload 추가
  ): ItineraryDay[] => {
    console.group('[PARSE_SERVER_RESPONSE] 서버 응답 파싱 시작');
    console.log('원본 서버 응답 데이터:', JSON.stringify(serverResponse, null, 2));
    console.log('현재 선택된 장소 (상세정보용) 수:', currentSelectedPlaces.length);
    console.log('여행 시작일:', tripStartDate);
    console.log('마지막으로 보낸 페이로드:', lastPayload ? '있음' : '없음 (null)');
    if (lastPayload) {
        console.log('마지막 페이로드 상세:', JSON.stringify(lastPayload, null, 2));
    }


    if (!serverResponse.schedule || !serverResponse.route_summary) {
      console.error('[useItineraryParser] 서버 응답에 필수 데이터(schedule 또는 route_summary)가 없습니다:', serverResponse);
      console.groupEnd();
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
          dayItemsOriginal.length, // totalPlacesInDay for this day
          lastPayload,             // pass lastPayload
          currentSelectedPlaces    // pass currentSelectedPlaces
        );
      });

      // ... keep existing code (routeData processing)
      const nodeIds: string[] = []; // Ensure string array
      const linkIds: string[] = []; // Ensure string array
      const interleaved_route_str: string[] = []; // Ensure string array for interleaved_route

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string) => { 
          const idStr = String(id); // Convert to string
          interleaved_route_str.push(idStr); 
          // This logic might need refinement based on actual interleaved_route structure
          // Assuming GeoJSON nodes might start with 'N' or be purely numeric strings after conversion.
          // And links are numeric strings. This heuristic needs validation.
          if (idStr.startsWith('N') || (interleaved_route_str.length % 2 !== 0 && !isNaN(parseInt(idStr)))) { 
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
        places: places.map(p => ({...p, id: String(p.id)})), // Ensure all place IDs are string
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds, // Already string[]
          linkIds: linkIds, // Already string[]
          segmentRoutes: routeInfo?.segment_routes || [] 
        },
        interleaved_route: interleaved_route_str // Use the string array
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
     console.table(result.flatMap(day => day.places.map(p => ({ day: day.day, id: p.id, name: p.name, matched_from_payload: !p.isFallback, x: p.x, y: p.y }))));


    if (placesWithDefaultCoords > 0) {
      console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표 및 정보를 사용합니다. 상세 정보 매칭에 실패했을 수 있습니다.`);
    }
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, []);

  return { parseServerResponse };
};
