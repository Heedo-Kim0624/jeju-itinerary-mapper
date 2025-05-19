
import { 
    SelectedPlace, 
    ItineraryDay, 
    ItineraryPlaceWithTime, 
    Place,
    NewServerScheduleResponse, 
    ServerScheduleItem, 
    ServerRouteSummaryItem,
    RouteData
} from '@/types';
import { CategoryName } from '@/utils/categoryUtils'; // Assuming CategoryName is still from here

interface UseScheduleParserProps {
  currentSelectedPlaces: SelectedPlace[];
}

interface MapContextGeoNode {
  id: string; 
  coordinates: [number, number]; 
}

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

// Updated updateItineraryWithCoordinates function
export const updateItineraryWithCoordinates = (
  itineraryDays: ItineraryDay[],
  mapContextGeoNodes: MapContextGeoNode[] | null // Changed any[] to MapContextGeoNode[]
): ItineraryDay[] => {
  if (!mapContextGeoNodes || !itineraryDays.length) {
    if (!mapContextGeoNodes) console.warn("[updateItineraryWithCoordinates] mapContextGeoNodes is null or empty.");
    if (!itineraryDays.length) console.warn("[updateItineraryWithCoordinates] itineraryDays is empty.");
    return itineraryDays;
  }
  console.log("[updateItineraryWithCoordinates] Starting coordinate update. GeoNodes available:", mapContextGeoNodes.length > 0);

  return itineraryDays.map(day => {
    const updatedPlaces = day.places.map(place => {
      const nodeIdStr = String(place.id); // Use place.id which should correspond to a geoNodeId
      const foundNode = mapContextGeoNodes.find(node => String(node.id) === nodeIdStr);
      
      if (foundNode && foundNode.coordinates) {
        return {
          ...place,
          x: foundNode.coordinates[0], 
          y: foundNode.coordinates[1], 
          geoNodeId: nodeIdStr, // Ensure geoNodeId is set
        };
      }
      // If no direct match on place.id, try place.geoNodeId if it's different
      if (place.geoNodeId && String(place.geoNodeId) !== nodeIdStr) {
        const foundNodeByGeoNodeId = mapContextGeoNodes.find(node => String(node.id) === String(place.geoNodeId));
        if (foundNodeByGeoNodeId && foundNodeByGeoNodeId.coordinates) {
          return {
            ...place,
            x: foundNodeByGeoNodeId.coordinates[0],
            y: foundNodeByGeoNodeId.coordinates[1],
          };
        }
      }
      console.warn(`[updateItineraryWithCoordinates] Coordinates not found for place ID: ${place.id} or geoNodeId: ${place.geoNodeId}`);
      return place;
    });
    return { ...day, places: updatedPlaces };
  });
};

// Standardized parseServerResponse function
export function parseServerResponse(
  serverResponse: NewServerScheduleResponse,
  tripStartDate: Date | null
): ItineraryDay[] {
  if (!serverResponse || !serverResponse.route_summary || !serverResponse.schedule || !tripStartDate) {
    console.warn('[parseServerResponse] 유효하지 않은 입력 데이터:', { serverResponse, tripStartDate });
    return [];
  }
  
  try {
    const { schedule, route_summary } = serverResponse;
    
    const dayOfWeekMap: { [key: string]: number } = { 
      Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 
    };
    
    const formatDateForDisplay = (date: Date): string => {
      return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
    };
    
    const dayIndexToDayNameAbbrev = (index: number): string => {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return dayNames[index % 7];
    };
    
    const tripStartDayOfWeekIndex = tripStartDate.getDay();
    
    const itineraryDays: ItineraryDay[] = route_summary.map((summaryItem: ServerRouteSummaryItem, index: number) => {
      const routeDayAbbrev = summaryItem.day.substring(0, 3);
      const routeDayOfWeekIndex = dayOfWeekMap[routeDayAbbrev] !== undefined ? dayOfWeekMap[routeDayAbbrev] : new Date(tripStartDate.getFullYear(), tripStartDate.getMonth(), tripStartDate.getDate() + index).getDay();
      
      let dayNumberOffset = routeDayOfWeekIndex - tripStartDayOfWeekIndex;
      // This logic for dayNumberOffset might be complex if summaryItem.day is not strictly sequential from tripStartDate.
      // A simpler approach is to use the index if days are ordered.
      // Assuming route_summary is ordered by day:
      const currentTripDate = new Date(tripStartDate);
      currentTripDate.setDate(tripStartDate.getDate() + index); // Day 1 is index 0, Day 2 is index 1 etc.
      
      const tripDayNumber = index + 1;
      
      const placesForThisDay: ItineraryPlaceWithTime[] = [];
      const placesRoutedNames = summaryItem.places_routed || [];
      
      placesRoutedNames.forEach((placeName: string, placeIndexInRoute: number) => {
        const matchingScheduleItems = schedule.filter((sItem: ServerScheduleItem) => 
          sItem.place_name === placeName // Consider if day matching in time_block is still needed: && sItem.time_block.startsWith(summaryItem.day)
        );
        
        const matchingScheduleItem = matchingScheduleItems.length > 0 ? matchingScheduleItems[0] : null;
        
        let timeStr = '';
        if (matchingScheduleItem) {
          const timeBlockParts = matchingScheduleItem.time_block.split('_');
          timeStr = timeBlockParts.length > 1 ? timeBlockParts[timeBlockParts.length -1] : ''; // Get last part e.g. 09 from Tue_09 or day from Mon
          if (timeStr.toLowerCase() === summaryItem.day.toLowerCase()) timeStr = ''; // if it's just the day name
        }

        // Use a temporary ID or try to find a real one if available.
        // The server's interleaved_route contains geoNodeIds. We need to map placeName to its ID.
        // For now, we'll use an index-based ID as a placeholder for the place.id.
        // The geoNodeId should ideally come from currentSelectedPlaces or be resolved from interleaved_route.
        const placeIdForSchedule = `${tripDayNumber}-${placeIndexInRoute}-${placeName.replace(/\s+/g, '')}`;
        
        placesForThisDay.push({
          id: placeIdForSchedule, // Placeholder ID
          name: placeName,
          category: (matchingScheduleItem?.place_type || 'unknown') as CategoryName,
          timeBlock: timeStr,
          x: 0, 
          y: 0,
          address: '',
          phone: '',
          description: '',
          rating: 0,
          image_url: '',
          road_address: '',
          homepage: '',
          isSelected: false,
          isCandidate: false,
          // geoNodeId will be crucial for map linking; this needs careful handling.
          // It should correspond to an ID in mapContextGeoNodes.
          // If summaryItem.interleaved_route contains the geoNodeIds for these places, that's the source.
          // For now, assume interleaved_route[placeIndexInRoute * 2] is the geoNodeId.
          geoNodeId: summaryItem.interleaved_route && summaryItem.interleaved_route[placeIndexInRoute * 2] ? String(summaryItem.interleaved_route[placeIndexInRoute * 2]) : placeIdForSchedule,
        });
      });
      
      const extractNodes = (route: (string | number)[]): string[] => {
        return route.filter((_, idx) => idx % 2 === 0).map(String);
      };
      const extractLinks = (route: (string | number)[]): string[] => {
        return route.filter((_, idx) => idx % 2 !== 0).map(String);
      };

      const routeData: RouteData = {
        nodeIds: extractNodes(summaryItem.interleaved_route?.map(String) || []),
        linkIds: extractLinks(summaryItem.interleaved_route?.map(String) || []),
      };
      
      return {
        day: tripDayNumber,
        places: placesForThisDay,
        totalDistance: summaryItem.total_distance_m / 1000,
        routeData: routeData,
        interleaved_route: summaryItem.interleaved_route?.map(String) || [],
        dayOfWeek: dayIndexToDayNameAbbrev(currentTripDate.getDay()),
        date: formatDateForDisplay(currentTripDate),
      };
    });
    
    itineraryDays.sort((a, b) => a.day - b.day);
    console.log('[parseServerResponse] Processed itinerary days:', JSON.parse(JSON.stringify(itineraryDays)));
    return itineraryDays;
  } catch (error) {
    console.error('[parseServerResponse] 파싱 중 오류 발생:', error);
    return [];
  }
}


export const useScheduleParser = ({ currentSelectedPlaces }: UseScheduleParserProps) => {
  // The parseServerResponse function is now standalone, so this hook might just export it
  // or use it internally if it had more specific logic tied to currentSelectedPlaces for enrichment.
  // For now, parseServerResponse takes all it needs.
  // If currentSelectedPlaces is needed for more detailed place info AFTER basic parsing:
  const enrichParsedResponse = useCallback((
    parsedDays: ItineraryDay[]
  ): ItineraryDay[] => {
    return parsedDays.map(day => ({
      ...day,
      places: day.places.map(place => {
        const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === place.name || String(p.id) === String(place.geoNodeId) || String(p.geoNodeId) === String(place.geoNodeId) );
        if (existingPlaceInfo) {
          return {
            ...place,
            address: existingPlaceInfo.address || place.address,
            phone: existingPlaceInfo.phone || place.phone,
            description: existingPlaceInfo.description || place.description,
            rating: existingPlaceInfo.rating || place.rating,
            image_url: existingPlaceInfo.image_url || place.image_url,
            road_address: existingPlaceInfo.road_address || place.road_address,
            homepage: existingPlaceInfo.homepage || place.homepage,
            category: (existingPlaceInfo.category || place.category) as CategoryName,
            // x and y coordinates should be updated by updateItineraryWithCoordinates
            x: place.x || existingPlaceInfo.x || 0,
            y: place.y || existingPlaceInfo.y || 0,
            geoNodeId: existingPlaceInfo.geoNodeId || place.geoNodeId || String(existingPlaceInfo.id),
          };
        }
        return place;
      })
    }));
  }, [currentSelectedPlaces]);

  return { parseServerResponse, enrichParsedResponse, updateItineraryWithCoordinates };
};
