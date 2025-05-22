
import { ItineraryDay, ItineraryPlaceWithTime, ServerScheduleItem, NewServerScheduleResponse, CoreSelectedPlace, SchedulePayload } from '@/types/core';
import { getProcessedItemDetails } from './scheduleItemProcessor';
import { extractTimeFromTimeBlock, calculateDepartTime, formatDate } from './timeUtils';

/**
 * Handles special cases like airports
 */
const isAirport = (name: string): boolean => {
  const placeNameLower = name?.toLowerCase() || "";
  return placeNameLower.includes("제주국제공항") || placeNameLower.includes("제주공항");
};

/**
 * Creates an airport entry for itinerary
 */
const createAirportEntry = (uniqueEntryId: string, timeBlock: string, arriveTime: string, departTime: string, stayDurationMinutes: number, numericId: number | null): ItineraryPlaceWithTime => {
  return {
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
    timeBlock: timeBlock,
    arriveTime: arriveTime,
    departTime: departTime,
    stayDuration: stayDurationMinutes,
    travelTimeToNext: "N/A",
    isFallback: false,
    numericDbId: numericId,
  };
};

/**
 * Creates a regular itinerary place entry
 */
const createItineraryPlace = (
  uniqueEntryId: string, 
  item: any, 
  timeBlock: string, 
  arriveTime: string, 
  departTime: string, 
  stayDurationMinutes: number, 
  numericId: number | null,
  geoNodeId?: string
): ItineraryPlaceWithTime => {
  return {
    id: uniqueEntryId,
    name: item.name,
    category: item.category,
    x: item.x,
    y: item.y,
    address: item.address,
    road_address: item.road_address,
    phone: item.phone,
    description: item.description,
    rating: item.rating,
    image_url: item.image_url,
    homepage: item.homepage,
    timeBlock: timeBlock,
    arriveTime: arriveTime,
    departTime: departTime,
    stayDuration: stayDurationMinutes,
    travelTimeToNext: "15분", // Placeholder
    isFallback: item.isFallback,
    geoNodeId: geoNodeId,
    numericDbId: numericId,
  };
};

/**
 * Groups itinerary places by combining consecutive entries for the same place
 */
export const buildGroupedItineraryPlaces = (
  dayItemsOriginal: ServerScheduleItem[],
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: CoreSelectedPlace[],
  dayNumber: number
): ItineraryPlaceWithTime[] => {
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
    
    if (isAirport(firstInGroup.name) && (i === 0 || (i + group.length -1) === dayItemsOriginal.length -1)) {
      groupedPlaces.push(
        createAirportEntry(uniqueEntryId, firstInGroup.item.time_block, arriveTime, departTime, stayDurationMinutes, firstInGroup.numericId)
      );
    } else {
      groupedPlaces.push(
        createItineraryPlace(uniqueEntryId, firstInGroup, firstInGroup.item.time_block, arriveTime, departTime, stayDurationMinutes, firstInGroup.numericId, firstInGroup.geoNodeId)
      );
    }
    
    i = j;
  }

  return groupedPlaces;
};

/**
 * Processes route data for an itinerary day
 */
export const processRouteData = (routeInfo: any) => {
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
    nodeIds,
    linkIds,
    interleaved_route,
    totalDistance
  };
};

/**
 * Main function to build itinerary days from server response
 */
export const buildItineraryDays = (
  serverResponse: NewServerScheduleResponse,
  currentSelectedPlaces: CoreSelectedPlace[] = [],
  tripStartDate: Date | null = null,
  lastPayload: SchedulePayload | null = null,
  dayMapping: Record<string, number>
): ItineraryDay[] => {
  const scheduleByDay = new Map<string, ServerScheduleItem[]>();
  const routeByDay = new Map<string, any>();
  
  // Organize schedule items by day
  serverResponse.schedule.forEach(item => {
    const dayKey = item.time_block.split('_')[0]; 
    if (!scheduleByDay.has(dayKey)) {
      scheduleByDay.set(dayKey, []);
    }
    scheduleByDay.get(dayKey)?.push(item);
  });
  
  // Sort items within each day by time_block
  scheduleByDay.forEach((items, dayKey) => {
    items.sort((a, b) => a.time_block.localeCompare(b.time_block));
    scheduleByDay.set(dayKey, items);
  });

  // Organize route data by day
  serverResponse.route_summary.forEach(route => {
    routeByDay.set(route.day, route); 
  });
  
  // Build itinerary for each day
  const sortedDayKeys = [...scheduleByDay.keys()].sort();
  
  const result = sortedDayKeys.map((dayOfWeekKey) => {
    const dayItemsOriginal = scheduleByDay.get(dayOfWeekKey) || [];
    const routeInfo = routeByDay.get(dayOfWeekKey); 
    const dayNumber = dayMapping[dayOfWeekKey];
    
    const groupedPlaces = buildGroupedItineraryPlaces(
      dayItemsOriginal, lastPayload, currentSelectedPlaces, dayNumber
    );

    const { nodeIds, linkIds, interleaved_route, totalDistance } = processRouteData(routeInfo);

    return {
      day: dayNumber,
      dayOfWeek: dayOfWeekKey,
      date: formatDate(tripStartDate, dayNumber - 1),
      places: groupedPlaces,
      totalDistance: totalDistance,
      routeData: {
        nodeIds: nodeIds,
        linkIds: linkIds,
        segmentRoutes: routeInfo?.segment_routes || [] 
      },
      interleaved_route: interleaved_route
    };
  });
  
  return result;
};
