import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload, PlaceDetails } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace, Place } from '@/types/core';
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

const determineFinalId = (originalId: string | number | undefined | null, fallbackNamePrefix: string, itemIndex: number, dayNumber: number): string | number => {
  if (originalId !== null && originalId !== undefined) {
    if (typeof originalId === 'number') {
      return originalId;
    }
    if (typeof originalId === 'string') {
      const numericId = parseInt(originalId, 10);
      if (!isNaN(numericId) && String(numericId) === originalId) {
        return numericId;
      }
      return originalId;
    }
  }
  return `${fallbackNamePrefix.replace(/\s+/g, '_')}_${itemIndex}_${dayNumber}_gen`;
};

const isValidTableName = (tableName: string): tableName is 'accommodation_information' | 'cafe_information' | 'landmark_information' | 'restaurant_information' => {
  return ['accommodation_information', 'cafe_information', 'landmark_information', 'restaurant_information'].includes(tableName);
};

const mapCategoryToSupabaseTable = (category: string): string | null => {
  switch (category) {
    case '숙소': return 'accommodation_information';
    case '카페': return 'cafe_information';
    case '관광지': return 'landmark_information';
    case '음식점': return 'restaurant_information';
    default: return null;
  }
};

const enrichScheduleWithSupabaseDetails = async (itineraryDays: ItineraryDay[]): Promise<ItineraryDay[]> => {
  console.group('[ENRICH_SCHEDULE_WITH_SUPABASE_DETAILS] Supabase 상세 정보 로딩 시작');
  
  const placesToFetchDetailsFor = new Map<string | number, { place: ItineraryPlaceWithTime, tableName: string }>();

  itineraryDays.forEach(day => {
    day.places.forEach(place => {
      // Fetch if it's a fallback OR if we want to always refresh from Supabase
      // And ensure the ID is a number (original DB ID) OR a string that can be parsed to a number.
      // For string IDs that are not purely numeric, Supabase lookup by 'id' might fail if 'id' column is numeric.
      // Assuming 'id' in Supabase tables is numeric for this logic.
      let numericId: number | null = null;
      if (typeof place.id === 'number') {
        numericId = place.id;
      } else if (typeof place.id === 'string') {
        const parsed = parseInt(place.id, 10);
        if (!isNaN(parsed) && String(parsed) === place.id) {
          numericId = parsed;
        }
      }

      if (place.isFallback && numericId !== null) {
        const tableName = mapCategoryToSupabaseTable(place.category);
        if (tableName) {
          // Use numericId for map key if Supabase ID is numeric
          placesToFetchDetailsFor.set(numericId, { place, tableName });
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

  const allFetches: Promise<PlaceDetails[] | null | undefined>[] = []; // Ensure it's Promise<any compatible>
  const placesByTable: Record<string, (string | number)[]> = {}; // ID can be string or number

  placesToFetchDetailsFor.forEach(({ tableName }, id) => {
    if (!placesByTable[tableName]) {
      placesByTable[tableName] = [];
    }
    placesByTable[tableName].push(id); // id is the key from placesToFetchDetailsFor, which is numeric here
  });

  const fetchedDetailsById = new Map<string | number, PlaceDetails>();

  for (const tableName in placesByTable) {
    const idsToFetch = placesByTable[tableName];
    if (idsToFetch.length > 0 && isValidTableName(tableName)) {
      console.log(`테이블 '${tableName}'에서 ID ${idsToFetch.join(', ')} 로딩 중...`);
      const fetchPromise = supabase
        .from(tableName)
        .select('id, place_name, road_address, lot_address, latitude, longitude, location')
        .in('id', idsToFetch) // Supabase client handles array of numbers or strings for 'in'
        .then(({ data, error }) => { // This .then returns Promise<void> implicitly
          if (error) {
            console.error(`테이블 '${tableName}' 정보 로딩 오류:`, error);
            return null; // Explicitly return null or undefined to make it Promise<null>
          }
          if (data) {
            const details: PlaceDetails[] = data.map((dbRow: any) => {
              const placeDetail: PlaceDetails = {
                id: dbRow.id,
                place_name: dbRow.place_name,
                road_address: dbRow.road_address,
                lot_address: dbRow.lot_address,
                latitude: dbRow.latitude,
                longitude: dbRow.longitude,
                location: dbRow.location,
              };
              // Use original place.id from placesToFetchDetailsFor for mapping if it was string
              // However, dbRow.id is the definitive ID from DB (number)
              fetchedDetailsById.set(dbRow.id, placeDetail);
              return placeDetail;
            });
            return details; // Return mapped details
          }
          return null; // Return null if no data
        });
      allFetches.push(fetchPromise);
    }
  }

  await Promise.all(allFetches);
  console.log('모든 Supabase 정보 로딩 완료. 총', fetchedDetailsById.size, '개 상세 정보 획득.');

  itineraryDays.forEach(day => {
    day.places.forEach(place => {
      let keyForMap: string | number | null = null;
      if (typeof place.id === 'number') {
        keyForMap = place.id;
      } else if (typeof place.id === 'string') {
        const parsed = parseInt(place.id, 10);
        if (!isNaN(parsed) && String(parsed) === place.id) {
          keyForMap = parsed; // Use numeric key if original ID was string representation of number
        } else {
          keyForMap = place.id; // Keep as string if non-numeric string ID (though Supabase part assumes numeric)
        }
      }

      if (keyForMap !== null && fetchedDetailsById.has(keyForMap)) {
        const details = fetchedDetailsById.get(keyForMap)!;
        console.log(`ID ${keyForMap} (${place.name}) 장소 정보 업데이트:`, details);
        place.details = details;
        if (details.longitude !== undefined && details.latitude !== undefined) {
          place.x = details.longitude;
          place.y = details.latitude;
        }
        place.name = details.place_name || place.name;
        place.address = details.road_address || details.lot_address || place.address;
        if (details.road_address) place.road_address = details.road_address;
        
        place.isFallback = false;
      }
    });
  });
  
  console.groupEnd();
  return itineraryDays;
};

const processServerScheduleItem = (
  serverItem: ServerScheduleItem,
  itemIndex: number, 
  dayNumber: number, 
  totalPlacesInDay: number,
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: SelectedPlace[] // Changed from CoreSelectedPlace
): ItineraryPlaceWithTime => {
  
  console.group(`[PROCESS_SERVER_ITEM] 서버 항목 "${serverItem.place_name || '이름 없음'}" 처리 (${itemIndex}번째, ${dayNumber}일차)`);
  console.log('서버 항목 원본:', serverItem);

  let placeIdToMatch: string | number | null = null;
  let matchSource: string | null = null;
  
  // serverItem.id can be string or number from server. parseIntId handles undefined.
  const serverItemIdToCompare = serverItem.id; 

  if (lastPayload) {
    if (serverItemIdToCompare !== undefined) {
      const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverItemIdToCompare));
      if (foundInSelected) {
        placeIdToMatch = foundInSelected.id; 
        matchSource = 'selected_places (ID 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverItemIdToCompare));
        if (foundInCandidate) {
          placeIdToMatch = foundInCandidate.id; 
          matchSource = 'candidate_places (ID 매칭)';
        }
      }
    }

    if (!placeIdToMatch && serverItem.place_name) {
      const foundInSelectedByName = lastPayload.selected_places?.find(p => p.name === serverItem.place_name);
      if (foundInSelectedByName) {
        placeIdToMatch = foundInSelectedByName.id;
        matchSource = 'selected_places (이름 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidateByName = lastPayload.candidate_places?.find(p => p.name === serverItem.place_name);
        if (foundInCandidateByName) {
          placeIdToMatch = foundInCandidateByName.id;
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
      console.log(`[useItineraryParser] 제주국제공항 고정 좌표 적용 (날짜 ${dayNumber}).`);
      const airportResult: ItineraryPlaceWithTime = {
        id: determineFinalId(placeIdToMatch ?? serverItem.id, 'airport', itemIndex, dayNumber),
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

  let placeDetails: SelectedPlace | undefined = undefined;
  if (placeIdToMatch !== null) {
    placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, placeIdToMatch));
    if(placeDetails){
       console.log(`ID ${placeIdToMatch} (타입: ${typeof placeIdToMatch})로 currentSelectedPlaces에서 상세 정보 찾음:`, placeDetails.name);
    } else {
       console.warn(`ID ${placeIdToMatch} (타입: ${typeof placeIdToMatch})로 currentSelectedPlaces에서 상세 정보 찾지 못함.`);
    }
  }

  const finalId = determineFinalId(placeDetails?.id ?? placeIdToMatch ?? serverItem.id, serverItem.place_name || 'unknown', itemIndex, dayNumber);

  if (placeDetails) {
    const result: ItineraryPlaceWithTime = {
      id: finalId,
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
      travelTimeToNext: serverItem.route_info_to_next?.duration_str || "15분",
      isFallback: false,
      geoNodeId: placeDetails.geoNodeId,
    };
    console.groupEnd();
    return result;
  }

  console.warn(`[useItineraryParser] 장소 "${serverItem.place_name}"에 대한 상세 정보를 찾을 수 없습니다. 폴백값을 사용합니다.`);
  const fallbackResult: ItineraryPlaceWithTime = {
    id: finalId,
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
    travelTimeToNext: serverItem.route_info_to_next?.duration_str || "15분",
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

  const parseServerResponse = useCallback(async (
    serverResponse: NewServerScheduleResponse,
    currentSelectedPlaces: SelectedPlace[] = [], // Changed from CoreSelectedPlace
    tripStartDate: Date | null = null,
    lastPayload: SchedulePayload | null = null // Added lastPayload
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
      // Fallback for day keys not in dayOrder (e.g., "Day1")
      const aOrder = dayOrder[a as keyof typeof dayOrder] || parseInt(a.replace(/\D/g, ''), 10) || 8;
      const bOrder = dayOrder[b as keyof typeof dayOrder] || parseInt(b.replace(/\D/g, ''), 10) || 8;
      return aOrder - bOrder;
    });
    
    sortedDayKeys.forEach((dayKey, index) => {
      dayMapping[dayKey] = index + 1; 
    });

    console.log('[useItineraryParser] 요일/날짜 키 -> 일차 매핑:', dayMapping);

    let result: ItineraryDay[] = sortedDayKeys.map((dayOfWeekKey) => {
      const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
      const routeInfo = routeByDay.get(dayOfWeekKey); 
      const dayNumber = dayMapping[dayOfWeekKey];
      
      const places: ItineraryPlaceWithTime[] = dayItemsOriginal.map((item, itemIndex) => {
        // Pass lastPayload and currentSelectedPlaces to processServerScheduleItem
        return processServerScheduleItem(
          item,
          itemIndex,
          dayNumber,
          dayItemsOriginal.length,
          lastPayload,            
          currentSelectedPlaces   
        );
      });

      // ... keep existing code (routeData processing)
      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route_processed: (string | number)[] = []; // Use a new array for processed route

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string) => { 
          // Ensure all IDs are strings for consistency if GeoJSON nodes/links use string IDs
          const idStr = String(id); 
          interleaved_route_processed.push(idStr); 
          // This logic might need refinement based on actual interleaved_route structure
          // Assuming nodes start with 'N' or are odd-indexed in a simple sequence
          if (typeof id === 'string' && (id.startsWith('N') || id.startsWith('n_'))) {
             nodeIds.push(idStr);
          } else if (typeof id === 'string' && (id.startsWith('L') || id.startsWith('l_'))) {
             linkIds.push(idStr);
          } else {
            // Fallback logic for numeric IDs or other patterns
            // This heuristic might not be robust. A clear indicator for nodes vs links is better.
             if (interleaved_route_processed.length % 2 !== 0) { 
               nodeIds.push(idStr);
             } else {
               linkIds.push(idStr);
             }
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
        interleaved_route: interleaved_route_processed // Use the processed array
      };
    });
    
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
    console.groupEnd(); 
    return result;
  }, []);

  return { parseServerResponse };
};
