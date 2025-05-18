
import { useCallback } from 'react';
import { SelectedPlace, ItineraryDay, ItineraryPlaceWithTime, CategoryName } from '@/types/supabase';
import { NewServerScheduleResponse, ServerScheduleItem, ServerRouteSummaryItem } from '@/types/schedule';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

// Helper interface for GeoJSON nodes expected from MapContext
interface MapContextGeoNode {
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

    const { schedule, route_summary } = response;
    
    const dayOfWeekMap: { [key: string]: number } = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    const tripStartDayOfWeekIndex = tripStartDate.getDay(); // 0 for Sun, 1 for Mon, ...

    const formatDateForDisplay = (date: Date): string => {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };
    const dayIndexToDayNameAbbrev = (index: number): string => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[index % 7];
    };

    const itineraryDays: ItineraryDay[] = route_summary.map((summaryItem: ServerRouteSummaryItem) => {
      const routeDayAbbrev = summaryItem.day.substring(0, 3); 
      const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev];

      let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
      if (dayNumberOffset < 0) dayNumberOffset += 7; 

      const currentTripDate = new Date(tripStartDate);
      currentTripDate.setDate(tripStartDate.getDate() + dayNumberOffset);
      
      const tripDayNumber = dayNumberOffset + 1; // 1-indexed day of the trip

      const placeNodeIdsInRoute = extractAllNodesFromRoute(summaryItem.interleaved_route).map(String);

      const placesForThisDay: ItineraryPlaceWithTime[] = [];
      
      placeNodeIdsInRoute.forEach(nodeIdStr => {
        const matchingScheduleItem = schedule.find(sItem => 
          (sItem.id !== undefined && String(sItem.id) === nodeIdStr) || sItem.place_name === nodeIdStr // Fallback by name if ID isn't a perfect match or missing
        );

        if (matchingScheduleItem) {
          const existingPlaceInfo = currentSelectedPlaces.find(p => 
             (matchingScheduleItem.id !== undefined && String(p.id) === String(matchingScheduleItem.id)) || p.name === matchingScheduleItem.place_name
          );
          
          const timeBlockParts = matchingScheduleItem.time_block.split('_');
          const timeStr = timeBlockParts.length > 1 ? timeBlockParts[1] : '';
          const formattedTime = timeStr && timeStr.length === 4 ? 
            `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}` : 
            (timeStr || ''); // Keep original if not in HHMM format

          placesForThisDay.push({
            id: String(matchingScheduleItem.id || nodeIdStr), // Use nodeIdStr as fallback ID
            name: matchingScheduleItem.place_name,
            category: matchingScheduleItem.place_type as CategoryName,
            timeBlock: formattedTime,
            x: existingPlaceInfo?.x || 0,
            y: existingPlaceInfo?.y || 0,
            address: existingPlaceInfo?.address || '',
            phone: existingPlaceInfo?.phone || '',
            description: existingPlaceInfo?.description || '',
            rating: existingPlaceInfo?.rating || 0,
            image_url: existingPlaceInfo?.image_url || '',
            road_address: existingPlaceInfo?.road_address || '',
            homepage: existingPlaceInfo?.homepage || '',
            isSelected: !!existingPlaceInfo?.isSelected,
            isCandidate: !!existingPlaceInfo?.isCandidate,
          });
        } else {
            console.warn(`[useScheduleParser] No schedule item found for NODE_ID: ${nodeIdStr} in day ${summaryItem.day}. Adding placeholder.`);
            // Add a placeholder if no matching schedule item is found to maintain route integrity
            placesForThisDay.push({
                id: nodeIdStr,
                name: `장소 ID: ${nodeIdStr}`, // Placeholder name
                category: 'unknown' as CategoryName,
                timeBlock: '',
                x:0, y:0, address: '', phone: '', description: '', rating: 0, image_url: '', road_address: '', homepage: '',
                isSelected: false, isCandidate: false,
            });
        }
      });
      
      return {
        day: tripDayNumber,
        places: placesForThisDay,
        totalDistance: summaryItem.total_distance_m / 1000, // km
        interleaved_route: summaryItem.interleaved_route,
        routeData: {
          nodeIds: placeNodeIdsInRoute,
          linkIds: extractAllLinksFromRoute(summaryItem.interleaved_route).map(String),
        },
        dayOfWeek: dayIndexToDayNameAbbrev(currentTripDate.getDay()),
        date: formatDateForDisplay(currentTripDate),
      };
    });

    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] Processed itinerary days (before coord update):', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
