import { useCallback } from 'react';
import { NewServerScheduleResponse, ServerScheduleItem, SchedulePayload } from '@/types/schedule';
import { ItineraryDay, ItineraryPlaceWithTime, SelectedPlace as CoreSelectedPlace } from '@/types/core';
import { mergeScheduleItems } from './parser-utils/mergeScheduleItems';
import { parseIntId, isSameId } from '@/utils/id-utils';

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

// This function processes a single server item to find matched place details and numeric ID
const getProcessedItemDetails = (
  serverItem: ServerScheduleItem,
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: CoreSelectedPlace[]
): {
  item: ServerScheduleItem;
  details: CoreSelectedPlace | undefined;
  numericId: number | null;
  isFallback: boolean;
  name: string;
  category: string;
  x: number;
  y: number;
  address: string;
  road_address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  homepage: string;
  geoNodeId?: string;
} => {
  let placeIdToMatch: string | number | null = null;
  let matchSource: string | null = null;
  const serverItemIdInt = parseIntId(serverItem.id);

  if (lastPayload) {
    if (serverItemIdInt !== null) {
      const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverItemIdInt));
      if (foundInSelected) {
        placeIdToMatch = foundInSelected.id;
        matchSource = 'selected_places (ID 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverItemIdInt));
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
  }
  
  const numericIdFromPayload = parseIntId(placeIdToMatch);
  let placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, numericIdFromPayload ?? placeIdToMatch ?? serverItemIdInt));

  if (!placeDetails && serverItemIdInt !== null) { // Fallback to serverItemIdInt if payload match failed
      placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, serverItemIdInt));
      if (placeDetails && !placeIdToMatch) { // If found using serverItemIdInt directly
         placeIdToMatch = serverItem.id; // Ensure placeIdToMatch is set
         matchSource = 'currentSelectedPlaces (서버 ID 직접 매칭)';
      }
  }
  
  const finalNumericId = parseIntId(placeDetails?.id ?? placeIdToMatch ?? serverItem.id);

  if (placeDetails) {
    return {
      item: serverItem,
      details: placeDetails,
      numericId: finalNumericId,
      isFallback: false,
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
      geoNodeId: placeDetails.geoNodeId,
    };
  }

  // Fallback if no details found
  return {
    item: serverItem,
    details: undefined,
    numericId: finalNumericId, // Attempt to parse serverItem.id if nothing else found
    isFallback: true,
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
    geoNodeId: undefined,
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
    
    // Sort items within each day by time_block to ensure correct grouping
    scheduleByDay.forEach((items, dayKey) => {
      items.sort((a, b) => a.time_block.localeCompare(b.time_block));
      scheduleByDay.set(dayKey, items);
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

    const result: ItineraryDay[] = sortedDayKeys.map((dayOfWeekKey, dayIndex) => {
      const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
      const routeInfo = routeByDay.get(dayOfWeekKey); 
      const dayNumber = dayMapping[dayOfWeekKey];
      
      const processedDayItems = dayItemsOriginal.map(serverItem => 
        getProcessedItemDetails(serverItem, lastPayload, currentSelectedPlaces)
      );

      const groupedPlaces: ItineraryPlaceWithTime[] = [];
      let i = 0;
      while (i < processedDayItems.length) {
        const currentProcessedItem = processedDayItems[i];
        let j = i;
        // Group consecutive items with the same numericId (if not null) or same name (if numericId is null)
        while (
          j < processedDayItems.length &&
          ( (currentProcessedItem.numericId !== null && processedDayItems[j].numericId === currentProcessedItem.numericId) ||
            (currentProcessedItem.numericId === null && processedDayItems[j].name === currentProcessedItem.name) )
        ) {
          j++;
        }
        const group = processedDayItems.slice(i, j);
        const firstInGroup = group[0];
        
        const stayDurationMinutes = group.length * 60; // Assuming each block is 1 hour
        const arriveTime = extractTimeFromTimeBlock(firstInGroup.item.time_block);
        const departTime = calculateDepartTime(arriveTime, stayDurationMinutes);

        // Generate unique ID for the ItineraryPlaceWithTime entry
        const baseIdPart = String(firstInGroup.numericId || firstInGroup.name.replace(/\s+/g, '_'));
        const uniqueEntryId = `${baseIdPart}_${dayNumber}_${i}`;
        
        const placeNameLower = firstInGroup.name?.toLowerCase() || "";
        const isAirport = placeNameLower.includes("제주국제공항") || placeNameLower.includes("제주공항");
        const totalPlacesInDayForAirportCheck = dayItemsOriginal.length; // Using original length for airport check context

        if (isAirport && (i === 0 || (i + group.length -1) === totalPlacesInDayForAirportCheck -1) ) {
            groupedPlaces.push({
                id: uniqueEntryId, // Airport entry ID
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
                timeBlock: firstInGroup.item.time_block,
                arriveTime: arriveTime,
                departTime: departTime,
                stayDuration: stayDurationMinutes,
                travelTimeToNext: "N/A",
                isFallback: false,
                numericDbId: firstInGroup.numericId, // Store numeric ID if available
            });
        } else {
          groupedPlaces.push({
            id: uniqueEntryId, // Unique ID for this specific itinerary entry
            name: firstInGroup.name,
            category: firstInGroup.category,
            x: firstInGroup.x,
            y: firstInGroup.y,
            address: firstInGroup.address,
            road_address: firstInGroup.road_address,
            phone: firstInGroup.phone,
            description: firstInGroup.description,
            rating: firstInGroup.rating,
            image_url: firstInGroup.image_url,
            homepage: firstInGroup.homepage,
            timeBlock: firstInGroup.item.time_block, // Use the time_block of the first item in group
            arriveTime: arriveTime,
            departTime: departTime,
            stayDuration: stayDurationMinutes,
            travelTimeToNext: "15분", // Placeholder, needs to be derived from route_summary
            isFallback: firstInGroup.isFallback,
            geoNodeId: firstInGroup.geoNodeId,
            numericDbId: firstInGroup.numericId, // Store the parsed numeric DB ID
          });
        }
        i = j;
      }

      // ... keep existing code (routeData processing, nodeIds, linkIds, interleaved_route, totalDistance)
      const nodeIds: string[] = [];
      const linkIds: string[] = [];
      const interleaved_route: (string | number)[] = [];

      if (routeInfo && routeInfo.interleaved_route) {
        routeInfo.interleaved_route.forEach((id: number | string) => { 
          const idStr = String(id);
          interleaved_route.push(idStr); 
          if (interleaved_route.length % 2 !== 0 || typeof id === 'string' && id.startsWith('N')) {
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
        places: groupedPlaces, // Use the new groupedPlaces
        totalDistance: totalDistance,
        routeData: {
          nodeIds: nodeIds,
          linkIds: linkIds,
          segmentRoutes: routeInfo?.segment_routes || [] 
        },
        interleaved_route: interleaved_route
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
     console.table(result.flatMap(day => day.places.map(p => ({ day: day.day, id: p.id, name: p.name, numericDbId: p.numericDbId, stayDuration: p.stayDuration, matched_from_payload: !p.isFallback, x: p.x, y: p.y }))));


    if (placesWithDefaultCoords > 0) {
      console.warn(`[useItineraryParser] ${placesWithDefaultCoords}개의 장소가 기본 좌표 및 정보를 사용합니다. 상세 정보 매칭에 실패했을 수 있습니다.`);
    }
    console.groupEnd(); // End PARSE_SERVER_RESPONSE group
    return result;
  }, []);

  return { parseServerResponse };
};
