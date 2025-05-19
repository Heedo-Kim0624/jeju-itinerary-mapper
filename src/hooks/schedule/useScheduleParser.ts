import { useCallback } from 'react';
import { 
    SelectedPlace, 
    ItineraryDay, 
    ItineraryPlaceWithTime, 
    Place, // General Place
    NewServerScheduleResponse, 
    ServerScheduleItem, 
    ServerRouteSummaryItem,
    RouteData // General RouteData
} from '@/types';
import { CategoryName } from '@/utils/categoryUtils'; // Assuming CategoryName is still from here
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

// Helper interface for GeoJSON nodes expected from MapContext
interface MapContextGeoNode {
  id: string; 
  coordinates: [number, number]; 
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
    return foundNode.coordinates; 
  }
  console.warn(`[findCoordinatesFromMapContextNodes] Coordinates not found for NODE_ID: ${nodeIdStr}`);
  return null;
};

// Function to update itinerary places with coordinates
export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[], // Expects global ItineraryDay
  mapContextGeoNodes: MapContextGeoNode[] | null
): ItineraryDay[] => { // Returns global ItineraryDay
  if (!mapContextGeoNodes || !itineraryDays.length) {
    if (!mapContextGeoNodes) console.warn("[updateItineraryWithCoordinates] mapContextGeoNodes is null or empty.");
    if (!itineraryDays.length) console.warn("[updateItineraryWithCoordinates] itineraryDays is empty.");
    return itineraryDays;
  }
  console.log("[updateItineraryWithCoordinates] Starting coordinate update. GeoNodes available:", mapContextGeoNodes.length > 0);

  return itineraryDays.map(day => {
    const updatedPlaces = day.places.map(place => {
      // place.id can be string or number, ensure findCoordinatesFromMapContextNodes handles it
      const coordinates = findCoordinatesFromMapContextNodes(place.id, mapContextGeoNodes);
      if (coordinates) {
        return {
          ...place,
          x: coordinates[0], 
          y: coordinates[1], 
          geoNodeId: String(place.id), // Ensure geoNodeId is string
        };
      }
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};

export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  const parseServerResponse = useCallback((
    response: NewServerScheduleResponse, // Uses global NewServerScheduleResponse
    tripStartDate: Date | null
  ): ItineraryDay[] => { // Returns global ItineraryDay[]
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
    // const tripStartDayOfWeekIndex = tripStartDate.getDay(); // Not directly used in current day mapping

    const formatDateForDisplay = (date: Date): string => {
        return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };
    const dayIndexToDayNameAbbrev = (index: number): string => {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames[index % 7];
    };

    const itineraryDays: ItineraryDay[] = route_summary.map((summaryItem: ServerRouteSummaryItem, index: number) => {
      // summaryItem.day is "Tue", "Wed" etc.
      // Calculate currentTripDate based on index relative to tripStartDate
      const currentTripDate = new Date(tripStartDate);
      currentTripDate.setDate(tripStartDate.getDate() + index); // Assuming summaryItems are in order of trip days
      
      const tripDayNumber = index + 1; 

      // places_routed and interleaved_route are now required string[] and number[] respectively in ServerRouteSummaryItem
      const places_routed = summaryItem.places_routed; // Directly use, it's string[]
      const interleaved_route_numbers = summaryItem.interleaved_route; // Directly use, it's number[]
      const interleaved_route_mixed: (string | number)[] = interleaved_route_numbers.map(String); // Convert to string for routeParser if needed, or keep as number if parser handles it. Let's convert to string for now for consistency with existing routeParser.


      const placesForThisDay: ItineraryPlaceWithTime[] = [];
      
      places_routed.forEach((placeName, placeIndexInRoute) => {
        const matchingScheduleItems = schedule.filter(sItem => 
          sItem.place_name === placeName //&& sItem.time_block.startsWith(summaryItem.day) - Time block matching might be too strict if day format differs
        );
        
        const matchingScheduleItem = matchingScheduleItems.length > 0 ? matchingScheduleItems[0] : null;
        const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === placeName);
        
        let timeStr = '';
        if (matchingScheduleItem) {
          const timeBlockParts = matchingScheduleItem.time_block.split('_');
          timeStr = timeBlockParts.length > 1 ? timeBlockParts[timeBlockParts.length -1] : ''; // Get last part e.g. 09 from Tue_09
        }
        const formattedTime = timeStr === '시작' || timeStr === '끝' ? timeStr : timeStr;

        // Use geoNodeId from existingPlaceInfo if available, otherwise, a temporary ID might be needed
        // The server response's interleaved_route contains actual node IDs.
        // We need to map placeName to its actual ID from interleaved_route or selectedPlaces.
        // For now, using existingPlaceInfo.id or a temp one.
        const placeId = existingPlaceInfo?.id || `temp_${placeName}_${placeIndexInRoute}`;
          
        placesForThisDay.push({
          id: placeId, 
          name: placeName,
          category: (matchingScheduleItem?.place_type || existingPlaceInfo?.category || 'unknown') as CategoryName,
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
          geoNodeId: existingPlaceInfo?.geoNodeId || String(placeId), // Fallback
        });
      });
      
      const routeDataForDay: RouteData = {
        // interleaved_route_mixed is (string|number)[], extractAllNodes/Links expect this.
        // Resulting nodeIds/linkIds must be string[] as per RouteData type.
        nodeIds: extractAllNodesFromRoute(interleaved_route_mixed).map(String),
        linkIds: extractAllLinksFromRoute(interleaved_route_mixed).map(String),
        // segmentRoutes can be omitted as it's optional in RouteData
      };
      
      return {
        day: tripDayNumber,
        places: placesForThisDay,
        totalDistance: summaryItem.total_distance_m / 1000,
        interleaved_route: interleaved_route_mixed, 
        routeData: routeDataForDay, // Conforms to new RouteData
        dayOfWeek: dayIndexToDayNameAbbrev(currentTripDate.getDay()), // Add dayOfWeek
        date: formatDateForDisplay(currentTripDate), // Add date
      };
    });

    itineraryDays.sort((a, b) => a.day - b.day);
    
    console.log('[useScheduleParser] Processed itinerary days (before coord update):', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  }, [currentSelectedPlaces]);

  return { parseServerResponse };
};
