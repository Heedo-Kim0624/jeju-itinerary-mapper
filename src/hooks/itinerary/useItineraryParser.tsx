
import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload, PlaceDetails } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace, Place } from '@/types/core';
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';
import { parseIntId, isSameId } from '@/utils/id-utils';
import { supabase } from '@/integrations/supabase/client';

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

// Helper function to determine the final ID, parsing to int if possible
const determineFinalId = (originalId: string | number | undefined | null, fallbackNamePrefix: string, itemIndex: number, dayNumber: number): string | number => {
  if (originalId !== null && originalId !== undefined) {
    if (typeof originalId === 'number') {
      return originalId; // Already a number
    }
    if (typeof originalId === 'string') {
      // Try to parse as integer if it's a string representation of a number
      const numericId = parseInt(originalId, 10);
      // Ensure the string was purely numeric and the parse was successful
      if (!isNaN(numericId) && String(numericId) === originalId) {
        return numericId;
      }
      // Otherwise, it's a non-numeric string ID (e.g., "place_abc")
      return originalId;
    }
  }
  // Fallback: generate a string ID if originalId is null, undefined, or an unexpected type
  return `${fallbackNamePrefix.replace(/\s+/g, '_')}_${itemIndex}_${dayNumber}_gen`;
};

// 테이블 이름에 대한 타입 가드 함수
const isValidTableName = (tableName: string): tableName is 'accommodation_information' | 'cafe_information' | 'landmark_information' | 'restaurant_information' => {
  return ['accommodation_information', 'cafe_information', 'landmark_information', 'restaurant_information'].includes(tableName);
};

const mapCategoryToSupabaseTable = (category: string): string | null => {
  switch (category) {
    case '숙소': return 'accommodation_information';
    case '카페': return 'cafe_information';
    case '관광지': return 'landmark_information';
    case '음식점': return 'restaurant_information';
    // Add other mappings if necessary. '교통', '기타' might not have corresponding info tables.
    default: return null;
  }
};

const enrichScheduleWithSupabaseDetails = async (itineraryDays: ItineraryDay[]): Promise<ItineraryDay[]> => {
  console.group('[ENRICH_SCHEDULE_WITH_SUPABASE_DETAILS] Supabase 상세 정보 로딩 시작');
  
  const placesToFetchDetailsFor = new Map<number, { place: ItineraryPlaceWithTime, tableName: string }>();

  itineraryDays.forEach(day => {
    day.places.forEach(place => {
      // Fetch if it's a fallback OR if we want to always refresh from Supabase (here, only for fallbacks with numeric ID)
      // And ensure the ID is a number (original DB ID)
      if (place.isFallback && typeof place.id === 'number') {
        const tableName = mapCategoryToSupabaseTable(place.category);
        if (tableName) {
          placesToFetchDetailsFor.set(place.id, { place, tableName });
        }
      }
    });
  });

  if (placesToFetchDetailsFor.size === 0) {
    console.log('Supabase에서 추가로 로드할 상세 정보가 없습니다.');
    console.groupEnd();
    return itineraryDays;
  }

  console.log(`${placesToFetchDetailsFor.size}개 장소에 대한 상세 정보를 Supabase에서 로드합니다.`);

  const allFetches: Promise<any>[] = [];
  const placesByTable: Record<string, number[]> = {};

  placesToFetchDetailsFor.forEach(({ tableName }, id) => {
    if (!placesByTable[tableName]) {
      placesByTable[tableName] = [];
    }
    placesByTable[tableName].push(id);
  });

  const fetchedDetailsById = new Map<number, PlaceDetails>();

  for (const tableName in placesByTable) {
    const idsToFetch = placesByTable[tableName];
    if (idsToFetch.length > 0 && isValidTableName(tableName)) {
      console.log(`테이블 '${tableName}'에서 ID ${idsToFetch.join(', ')} 로딩 중...`);
      const fetchPromise = supabase
        .from(tableName)
        .select('id, place_name, road_address, lot_address, latitude, longitude, location') // Adjust columns as needed
        .in('id', idsToFetch)
        .then(({ data, error }) => {
          if (error) {
            console.error(`테이블 '${tableName}' 정보 로딩 오류:`, error);
            return;
          }
          if (data) {
            data.forEach((dbRow: any) => {
              const placeDetail: PlaceDetails = {
                id: dbRow.id, // Should be number
                place_name: dbRow.place_name,
                road_address: dbRow.road_address,
                lot_address: dbRow.lot_address,
                latitude: dbRow.latitude,   // y
                longitude: dbRow.longitude, // x
                location: dbRow.location,
              };
              fetchedDetailsById.set(dbRow.id, placeDetail);
            });
          }
        });
      allFetches.push(fetchPromise);
    }
  }

  await Promise.all(allFetches);
  console.log('모든 Supabase 정보 로딩 완료. 총', fetchedDetailsById.size, '개 상세 정보 획득.');

  // Update ItineraryPlaceWithTime objects
  itineraryDays.forEach(day => {
    day.places.forEach(place => {
      if (typeof place.id === 'number' && fetchedDetailsById.has(place.id)) {
        const details = fetchedDetailsById.get(place.id)!;
        console.log(`ID ${place.id} (${place.name}) 장소 정보 업데이트:`, details);
        place.details = details;
        if (details.longitude !== undefined && details.latitude !== undefined) {
          place.x = details.longitude;
          place.y = details.latitude;
        }
        place.name = details.place_name || place.name; // Update name if different
        place.address = details.road_address || details.lot_address || place.address;
        // If road_address exists in details, update place.road_address
        if (details.road_address) place.road_address = details.road_address;
        
        place.isFallback = false; // Details successfully fetched and applied
      }
    });
  });
  
  console.groupEnd();
  return itineraryDays;
};

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

  let placeIdToMatch: string | number | null = null;
  let matchSource: string | null = null;
  const serverItemIdAsNumber = parseIntId(serverItem.id); // serverItem.id could be string, number or undefined

  if (serverItemIdAsNumber !== null) {
    console.log(`서버 항목 ID "${serverItem.id}" 정수 변환 시도: ${serverItemIdAsNumber}`);
  } else if (serverItem.id !== undefined) {
    console.log(`서버 항목 ID "${serverItem.id}"는 정수로 변환되지 않음 (문자열 가능성).`);
  } else {
    console.log(`서버 항목 ID 없음.`);
  }

  if (lastPayload) {
    // 1. 서버 항목 ID (정수 또는 문자열) -> 페이로드 ID (정수 또는 문자열) 매칭
    // isSameId can compare number with string representation of number
    const serverIdToCompare = serverItem.id; // Use original serverItem.id for isSameId

    if (serverIdToCompare !== undefined) {
      const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverIdToCompare));
      if (foundInSelected) {
        placeIdToMatch = foundInSelected.id; // Keep original type from payload (string | number)
        matchSource = 'selected_places (ID 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverIdToCompare));
        if (foundInCandidate) {
          placeIdToMatch = foundInCandidate.id; // Keep original type from payload (string | number)
          matchSource = 'candidate_places (ID 매칭)';
        }
      }
    }

    // 2. ID 매칭 실패 시, 서버 항목 이름 -> 페이로드 이름 매칭
    if (!placeIdToMatch && serverItem.place_name) {
      const foundInSelectedByName = lastPayload.selected_places?.find(p => p.name === serverItem.place_name);
      if (foundInSelectedByName) {
        placeIdToMatch = foundInSelectedByName.id; // Keep original type from payload (string | number)
        matchSource = 'selected_places (이름 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidateByName = lastPayload.candidate_places?.find(p => p.name === serverItem.place_name);
        if (foundInCandidateByName) {
          placeIdToMatch = foundInCandidateByName.id; // Keep original type from payload (string | number)
          matchSource = 'candidate_places (이름 매칭)';
        }
      }
    }
    
    if (placeIdToMatch) {
      console.log(`장소 "${serverItem.place_name}" 매칭 ID: ${placeIdToMatch} (타입: ${typeof placeIdToMatch}, 소스: ${matchSource})`);
    } else {
      console.warn(`장소 "${serverItem.place_name}"에 대한 ID를 페이로드에서 찾지 못했습니다.`);
    }
  } else {
    console.warn('Last sent payload is null. Cannot match with payload.');
  }
  
  const placeNameLower = serverItem.place_name?.toLowerCase() || "";
  const isAirport = placeNameLower.includes("제주국제공항") || placeNameLower.includes("제주공항");

  if (isAirport) {
    const isFirstOrLastPlace = (itemIndex === 0 || itemIndex === totalPlacesInDay - 1);
    if (isFirstOrLastPlace) {
      console.log(`[useItineraryParser] Applying fixed coordinates for Jeju International Airport as first/last place of day ${dayNumber}.`);
      const airportResult: ItineraryPlaceWithTime = { // Explicitly type
        id: determineFinalId(placeIdToMatch, 'airport', itemIndex, dayNumber),
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
  if (placeIdToMatch !== null) { // Check for null explicitly
    // currentSelectedPlaces에서 최종 ID로 상세 정보 찾기
    placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, placeIdToMatch));
    if(placeDetails){
       console.log(`ID ${placeIdToMatch} (타입: ${typeof placeIdToMatch})로 currentSelectedPlaces에서 상세 정보 찾음:`, placeDetails.name);
    } else {
       console.warn(`ID ${placeIdToMatch} (타입: ${typeof placeIdToMatch})로 currentSelectedPlaces에서 상세 정보 찾지 못함.`);
    }
  }

  if (placeDetails) {
    const result: ItineraryPlaceWithTime = { // Explicitly type
      id: determineFinalId(placeDetails.id, placeDetails.name, itemIndex, dayNumber), 
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
      stayDuration: 60, // Default stay duration
      travelTimeToNext: "15분", // Example, should be from route_summary if available
      isFallback: false, // Details found from currentSelectedPlaces
      geoNodeId: placeDetails.geoNodeId,
      // details field is not populated here, will be done by enrichScheduleWithSupabaseDetails if needed
    };
    console.groupEnd();
    return result;
  }

  console.warn(`[useItineraryParser] 장소 "${serverItem.place_name}"에 대한 상세 정보를 찾을 수 없습니다. 기본값을 사용합니다.`);
  const fallbackResult: ItineraryPlaceWithTime = { // Explicitly type
    id: determineFinalId(serverItem.id, (serverItem.place_name || 'unknown'), itemIndex, dayNumber),
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
    isFallback: true, // Mark as fallback, to be potentially enriched by Supabase
    // details field is not populated here
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

  const parseServerResponse = useCallback(async (
    serverResponse: NewServerScheduleResponse,
    currentSelectedPlaces: CoreSelectedPlace[] = [],
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null
  ): Promise<ItineraryDay[]> => {
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

    let result: ItineraryDay[] = sortedDayKeys.map((dayOfWeekKey) => {
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
        places: places, // places array created by processServerScheduleItem
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: routeInfo?.segment_routes || [] 
        },
        interleaved_route: interleaved_route
      };
    });
    
    // Enrich with Supabase details
    result = await enrichScheduleWithSupabaseDetails(result);

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
