
import { useCallback } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { 
  NewServerScheduleResponse, 
  ServerScheduleItem, 
  ServerRouteSummaryItem, 
  ItineraryPlace as ScheduleItineraryPlace, 
  ItineraryDay as ScheduleItineraryDay 
} from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';
import { CategoryName } from '@/utils/categoryUtils';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse,
    tripStartDate: Date | null
  ): ScheduleItineraryDay[] => {
    if (!tripStartDate) {
      console.error("[useScheduleParser] Trip start date is required to parse server response days.");
      return [];
    }

    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeek = tripStartDate.getDay();

    const nodeToPlaceMap = new Map<string, ScheduleItineraryPlace>();
    response.schedule.forEach((item: ServerScheduleItem) => {
      const existingPlace = currentSelectedPlaces.find(p =>
        (item.id !== undefined && String(p.id) === String(item.id)) || p.name === item.place_name
      );

      let placeDetail: ScheduleItineraryPlace;
      if (existingPlace) {
        placeDetail = {
          ...existingPlace,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
          node_id: item.node_id || item.place_info?.node_id || existingPlace.node_id,
        };
      } else {
        placeDetail = {
          id: item.id?.toString() || item.place_name,
          name: item.place_name,
          category: item.place_type as CategoryName,
          timeBlock: item.time_block,
          node_id: item.node_id || item.place_info?.node_id,
          x: item.x ?? item.place_info?.x ?? 0,
          y: item.y ?? item.place_info?.y ?? 0,
          address: item.address || '',
          phone: item.phone || '',
          description: item.description || '',
          rating: item.rating || 0,
          image_url: item.image_url || '',
          road_address: item.road_address || '',
          homepage: item.homepage || '',
          isSelected: false,
          isCandidate: false,
          // Ensure all Place fields are covered
          operationTimeData: {},
          geoNodeId: undefined,
          geoNodeDistance: undefined,
          weight: undefined,
          raw: undefined,
          categoryDetail: undefined,
          reviewCount: undefined,
          naverLink: undefined,
          instaLink: undefined,
          operatingHours: undefined,
        };
      }
      if (placeDetail.node_id) nodeToPlaceMap.set(String(placeDetail.node_id), placeDetail);
      nodeToPlaceMap.set(String(placeDetail.id), placeDetail); // Fallback to id
    });

    return response.route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayOfWeekString = summaryItem.day.substring(0, 3);
      const routeDayOfWeek = dayOfWeekMap[routeDayOfWeekString] ?? (new Date().getDay());
      let tripDayNumber = routeDayOfWeek - tripStartDayOfWeek + 1;
      if (tripDayNumber <= 0) tripDayNumber += 7;

      const currentDayDate = new Date(tripStartDate);
      currentDayDate.setDate(tripStartDate.getDate() + tripDayNumber - 1);
      const dateString = `${String(currentDayDate.getMonth() + 1).padStart(2, '0')}/${String(currentDayDate.getDate()).padStart(2, '0')}`;

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);
      
      const dayPlaces: ScheduleItineraryPlace[] = placeNodeIdsInRoute.map(nodeId => {
        return nodeToPlaceMap.get(nodeId) || {
          id: nodeId, name: `경유지 ${nodeId}`, category: '경유지' as CategoryName,
          x: 0, y: 0, address: '', phone: '', description: '', rating: 0,
          image_url: '', road_address: '', homepage: '', isSelected: false, isCandidate: false, node_id: nodeId,
          operationTimeData: {}, geoNodeId: undefined, geoNodeDistance: undefined, weight: undefined, raw: undefined,
          categoryDetail: undefined, reviewCount: undefined, naverLink: undefined, instaLink: undefined, operatingHours: undefined,
        } as ScheduleItineraryPlace;
      });

      return {
        day: tripDayNumber,
        dayOfWeek: routeDayOfWeekString,
        date: dateString,
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
