import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/core';
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { getDateStringMMDD, getDayOfWeekString } from '../itinerary/itineraryUtils';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

// Helper interface for GeoJSON nodes expected from MapContext
export interface MapContextGeoNode {
  id: string; // This should be the NODE_ID
  coordinates: [number, number]; // [longitude, latitude]
}

// Function to find coordinates from MapContext's GeoJSON nodes
export const findCoordinatesFromMapContextNodes = (
  nodeIdToFind: string | number,
  mapContextGeoNodes: MapContextGeoNode[] | null
): [number, number] | null => {
  if (!mapContextGeoNodes) return null;
  const nodeIdStr = String(nodeIdToFind);
  const foundNode = mapContextGeoNodes.find(node => String(node.id) === nodeIdStr);
  
  if (foundNode && foundNode.coordinates) {
    return foundNode.coordinates; // [longitude, latitude]
  }
  console.warn(`[findCoordinatesFromMapContextNodes] Coordinates not found for NODE_ID: ${nodeIdStr}`);
  return null;
};

// Function to update itinerary places with coordinates
export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[],
  mapContextGeoNodes: MapContextGeoNode[] | null
): ItineraryDay[] => {
  if (!mapContextGeoNodes || !itineraryDays.length) {
    if (!mapContextGeoNodes) console.warn("[updateItineraryWithCoordinates] mapContextGeoNodes is null or empty.");
    if (!itineraryDays.length) console.warn("[updateItineraryWithCoordinates] itineraryDays is empty.");
    return itineraryDays;
  }
  console.log("[updateItineraryWithCoordinates] Starting coordinate update. GeoNodes available:", mapContextGeoNodes.length > 0);

  return itineraryDays.map(day => {
    const updatedPlaces = day.places.map(place => {
      const coordinates = findCoordinatesFromMapContextNodes(place.id, mapContextGeoNodes);
      if (coordinates) {
        return {
          ...place,
          x: coordinates[0], // longitude
          y: coordinates[1], // latitude
          geoNodeId: String(place.id),
        };
      }
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};

// Helper: 서버 스케줄 아이템과 선택된 장소 정보를 바탕으로 ItineraryPlaceWithTime 객체를 생성
function createPlaceWithTimeFromSchedule(
  placeName: string,
  placeIndexInRoute: number,
  dayAbbrev: string, // 예: "Mon", "Tue" - 스케줄 아이템 필터링에 사용
  scheduleItems: ServerScheduleItem[],
  currentSelectedPlaces: SelectedPlace[]
): ItineraryPlaceWithTime {
  const matchingScheduleItem = scheduleItems.find(sItem => 
    sItem.place_name === placeName && sItem.time_block.startsWith(dayAbbrev)
  );

  const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === placeName);
  
  let timeStr = '';
  if (matchingScheduleItem) {
    const timeBlockParts = matchingScheduleItem.time_block.split('_');
    timeStr = timeBlockParts.length > 1 ? timeBlockParts[timeBlockParts.length -1] : ''; // 마지막 부분을 시간으로 가정
    if (timeStr === '시작' || timeStr === '끝') {
        // 특별한 시간 문자열은 그대로 사용
    } else {
        // 숫자 시간 문자열은 그대로 사용 (예: '09', '14')
    }
  } else {
    console.warn(`[useScheduleParser] No schedule item found for place: ${placeName} in day starting with ${dayAbbrev}.`);
  }

  const baseId = existingPlaceInfo?.id || placeIndexInRoute;
  const placeId = typeof baseId === 'number' ? String(baseId) : baseId;

  return {
    id: placeId,
    name: placeName,
    category: (matchingScheduleItem?.place_type || existingPlaceInfo?.category || 'unknown') as CategoryName,
    timeBlock: timeStr, // 'HH' 형식 또는 '시작', '끝'
    x: existingPlaceInfo?.x || 0,
    y: existingPlaceInfo?.y || 0,
    address: existingPlaceInfo?.address || '',
    phone: existingPlaceInfo?.phone || '',
    description: existingPlaceInfo?.description || '',
    rating: existingPlaceInfo?.rating || 0,
    image_url: existingPlaceInfo?.image_url || '',
    road_address: existingPlaceInfo?.road_address || '',
    homepage: existingPlaceInfo?.homepage || '',
    // isSelected, isCandidate는 ItineraryPlaceWithTime에 없으므로 SelectedPlace의 필드를 직접 참조하지 않음.
    // 필요하다면 ItineraryPlaceWithTime 타입에 추가해야 함.
    // arriveTime, departTime 등은 서버 응답에 따라 채워지거나, 후처리 단계에서 계산될 수 있음.
    // 현재 구조에서는 timeBlock을 arriveTime의 근사값으로 사용.
    arriveTime: timeStr, 
    geoNodeId: placeId,
  };
}

// Helper: 서버의 단일 route_summary 아이템을 ItineraryDay 객체로 변환
function parseSingleRouteSummary(
  summaryItem: ServerRouteSummaryItem,
  dayIndex: number, // 0부터 시작하는 인덱스 (일정의 순서)
  allScheduleItems: ServerScheduleItem[],
  tripStartDate: Date,
  currentSelectedPlaces: SelectedPlace[],
  dayOfWeekMap: { [key: string]: number }
): ItineraryDay {
  const routeDayAbbrev = summaryItem.day.substring(0, 3); // "Mon", "Tue" 등
  const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev];
  const tripStartDayOfWeekIndex = tripStartDate.getDay();

  let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
  if (dayNumberOffset < 0) dayNumberOffset += 7; 

  const currentTripDate = new Date(tripStartDate);
  currentTripDate.setDate(tripStartDate.getDate() + dayNumberOffset + (dayIndex > 0 && routeDayOfWeekIndex < tripStartDayOfWeekIndex ? 7 * Math.floor(dayIndex / Object.keys(dayOfWeekMap).length) : 0) ); // 주차를 고려한 날짜 조정 추가 가능성

  // tripDayNumber는 서버 응답 순서(index)를 기반으로 1부터 시작
  const tripDayNumber = dayIndex + 1;

  const placesForThisDay: ItineraryPlaceWithTime[] = (summaryItem.places_routed || []).map(
    (placeName, placeIdx) => createPlaceWithTimeFromSchedule(
      placeName,
      placeIdx,
      routeDayAbbrev, // 현재 요일 약자 전달
      allScheduleItems,
      currentSelectedPlaces
    )
  );
  
  const interleaved_route = summaryItem.interleaved_route || [];

  return {
    day: tripDayNumber,
    places: placesForThisDay,
    totalDistance: summaryItem.total_distance_m / 1000, // m에서 km로 변환
    interleaved_route: interleaved_route,
    routeData: {
      nodeIds: extractAllNodesFromRoute(interleaved_route).map(String),
      linkIds: extractAllLinksFromRoute(interleaved_route).map(String),
      // segmentRoutes는 현재 서버 응답에서 직접 제공되지 않으므로 빈 배열로 초기화
      segmentRoutes: [], 
    },
    dayOfWeek: getDayOfWeekString(currentTripDate), // itineraryUtils 사용
    date: getDateStringMMDD(currentTripDate),     // itineraryUtils 사용
  };
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    console.log('[useScheduleParser] Processing server response:', response);
    if (!response || !response.schedule || !response.route_summary) {
      console.error('[useScheduleParser] Invalid server response structure received:', response);
      return [];
    }
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const { schedule: allScheduleItems, route_summary } = response;
    
    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

    const itineraryDays: ItineraryDay[] = route_summary.map(
      (summaryItem, index) => parseSingleRouteSummary(
        summaryItem,
        index,
        allScheduleItems,
        tripStartDate,
        currentSelectedPlaces,
        dayOfWeekMap
      )
    );

    // 일자순으로 정렬 (tripDayNumber 기준)
    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] Processed itinerary days (before coord update):', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
