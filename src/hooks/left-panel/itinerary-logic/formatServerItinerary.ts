
import {
  NewServerScheduleResponse,
  ServerScheduleItem,
  ItineraryDay,
  ItineraryPlaceWithTime,
  CategoryName,
  Place,
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
  originalSelectedPlaces: Place[] 
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

  return serverResponse.route_summary.map((summary, index) => {
    const routeDayAbbrev = summary.day.substring(0, 3);

    const actualDayDate = new Date(tripStartDate);
    actualDayDate.setDate(tripStartDate.getDate() + index);
    const dayOfWeek = getDayOfWeekString(actualDayDate);
    const dateStr = getDateStringMMDD(actualDayDate);

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
          id: item.id?.toString() || originalPlace?.id?.toString() || item.place_name,
          name: item.place_name || originalPlace?.name || 'Unknown Place',
          category: (item.place_type || originalPlace?.category || 'unknown') as CategoryName,
          timeBlock: item.time_block,
          x: originalPlace?.x ?? 0,
          y: originalPlace?.y ?? 0,
          address: originalPlace?.address || '',
          phone: originalPlace?.phone || '',
          description: originalPlace?.description || '',
          rating: originalPlace?.rating || 0,
          image_url: originalPlace?.image_url || '',
          road_address: originalPlace?.road_address || '',
          homepage: originalPlace?.homepage || '',
          isSelected: originalPlace?.isSelected || false,
          isCandidate: originalPlace?.isCandidate || false,
          geoNodeId: originalPlace?.geoNodeId || item.id?.toString() || originalPlace?.id?.toString(),
          arriveTime: undefined,
          departTime: undefined,
          stayDuration: undefined,
          travelTimeToNext: undefined,
          isFallback: true,
          numericDbId: typeof scheduleItem.id === 'number' ? scheduleItem.id : null,
        };
      });

    const nodeIds: string[] = [];
    const linkIds: string[] = [];
    summary.interleaved_route.forEach((id, i) => {
      if (i % 2 === 0) {
        nodeIds.push(String(id));
      } else {
        linkIds.push(String(id));
      }
    });

    return {
      day: index + 1,
      date: dateStr,
      dayOfWeek: dayOfWeek,
      places: dayPlaces,
      totalDistance: summary.total_distance_m / 1000, // km 단위
      routeData: {
        nodeIds,
        linkIds,
        segmentRoutes: [],
      },
      interleaved_route: summary.interleaved_route.map(String),
    };
  });
};
