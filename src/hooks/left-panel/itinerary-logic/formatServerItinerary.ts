
import {
  NewServerScheduleResponse,
  ServerScheduleItem,
  ItineraryDay,
  ItineraryPlaceWithTime,
  CategoryName,
  Place, // Place 타입을 import 합니다.
} from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils';

/**
 * Formats the server response from the schedule generation API into ItineraryDay objects.
 * @param serverResponse The raw response from the server.
 * @param tripStartDate The start date of the trip.
 * @param originalSelectedPlaces The list of originally selected places with full details.
 * @returns A formatted array of ItineraryDay objects, or an empty array if formatting fails or data is invalid.
 */
export const formatServerItinerary = (
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date,
  originalSelectedPlaces: Place[] // 추가된 파라미터
): ItineraryDay[] => {
  if (
    !serverResponse ||
    !serverResponse.schedule ||
    serverResponse.schedule.length === 0 ||
    !serverResponse.route_summary ||
    serverResponse.route_summary.length === 0
  ) {
    console.warn('[formatServerItinerary] Invalid server response or empty schedule/route_summary.');
    return [];
  }

  const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

  return serverResponse.route_summary.map((summary, index) => {
    const routeDayAbbrev = summary.day.substring(0, 3);

    const actualDayDate = new Date(tripStartDate);
    actualDayDate.setDate(tripStartDate.getDate() + index);

    const placeNodeIdsInRoute = summary.interleaved_route
      .filter((_id, idx) => idx % 2 === 0)
      .map(id => String(id));

    const dayPlaces: ItineraryPlaceWithTime[] = serverResponse.schedule
      .filter(item => {
        const itemIdStr = item.id !== undefined ? String(item.id) : null;
        const scheduleItemDayAbbrev = item.time_block.substring(0, 3);
        return itemIdStr && placeNodeIdsInRoute.includes(itemIdStr) && scheduleItemDayAbbrev === routeDayAbbrev;
      })
      .map((item: ServerScheduleItem): ItineraryPlaceWithTime => {
        // 원본 장소 목록에서 현재 항목(item)에 해당하는 상세 정보를 찾습니다.
        const originalPlace = originalSelectedPlaces.find(p =>
          (item.id !== undefined && p.id !== undefined && p.id.toString() === item.id.toString()) || p.name === item.place_name
        );

        return {
          id: item.id?.toString() || originalPlace?.id?.toString() || item.place_name, // ID 우선순위: item.id -> originalPlace.id -> item.place_name
          name: item.place_name || originalPlace?.name || 'Unknown Place',
          category: (item.place_type || originalPlace?.category || 'unknown') as CategoryName,
          timeBlock: item.time_block, // 서버 응답의 time_block 사용
          x: originalPlace?.x ?? 0, // originalPlace에서 x 좌표 가져오기
          y: originalPlace?.y ?? 0, // originalPlace에서 y 좌표 가져오기
          address: originalPlace?.address || '', // originalPlace에서 주소 가져오기
          phone: originalPlace?.phone || '', // originalPlace에서 전화번호 가져오기 (선택적)
          description: originalPlace?.description || '', // originalPlace에서 설명 가져오기 (선택적)
          rating: originalPlace?.rating || 0, // originalPlace에서 평점 가져오기 (선택적)
          image_url: originalPlace?.image_url || '', // originalPlace에서 이미지 URL 가져오기 (선택적)
          road_address: originalPlace?.road_address || '', // originalPlace에서 도로명 주소 가져오기
          homepage: originalPlace?.homepage || '', // originalPlace에서 홈페이지 가져오기 (선택적)
          isSelected: originalPlace?.isSelected || false, // originalPlace에서 선택 상태 가져오기 (선택적)
          isCandidate: originalPlace?.isCandidate || false, // originalPlace에서 후보 상태 가져오기 (선택적)
          geoNodeId: originalPlace?.geoNodeId || item.id?.toString() || originalPlace?.id?.toString(), // originalPlace에서 geoNodeId 가져오기
          // arriveTime, departTime, stayDuration, travelTimeToNext 등은 서버 응답에 없으므로,
          // 필요하다면 이 단계 또는 후속 단계에서 파생/설정해야 합니다.
        };
      });
    
    const tripDayNumber = index + 1;

    return {
      day: tripDayNumber,
      places: dayPlaces,
      totalDistance: summary.total_distance_m / 1000,
      interleaved_route: summary.interleaved_route.map(String),
      routeData: {
        nodeIds: placeNodeIdsInRoute,
        linkIds: summary.interleaved_route.filter((_id, idx) => idx % 2 !== 0).map(String),
        segmentRoutes: [],
      },
      dayOfWeek: getDayOfWeekString(actualDayDate),
      date: getDateStringMMDD(actualDayDate),
    };
  });
};
