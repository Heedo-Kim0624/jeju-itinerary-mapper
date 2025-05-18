
import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase';
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ItineraryDay[] => {
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    const allServerPlaces: ItineraryPlaceWithTime[] = response.schedule.map((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p =>
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );
      if (existingPlace) {
        return {
          ...existingPlace,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
        };
      }
      return {
        id: item.id?.toString() || item.place_name,
        name: item.place_name,
        category: item.place_type as CategoryName,
        timeBlock: item.time_block,
        x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
        image_url: '', road_address: '', homepage: '',
        isSelected: false, isCandidate: false,
      } as ItineraryPlaceWithTime;
    });

    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeekString = summaryItem.day.substring(0, 3);
      const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString];
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) {
        tripDayNumber += 7;
      }

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);

      const dayPlaces = allServerPlaces.filter(p => {
        const pIdStr = String(p.id);
        return placeNodeIdsInRoute.includes(pIdStr);
      });

      return {
        day: tripDayNumber,
        places: dayPlaces,
        totalDistance: summaryItem.total_distance_m / 1000,
        interleaved_route: summaryItem.interleaved_route,
        routeData: {
          nodeIds: placeNodeIdsInRoute,
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        }
      };
    });
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
