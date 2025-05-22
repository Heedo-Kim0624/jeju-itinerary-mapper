import { ServerScheduleItem, SelectedPlace as CoreSelectedPlace, ItineraryPlaceWithTime } from '@/types/core';

/**
 * Generates a unique ID for an itinerary place, falling back if server ID is missing.
 */
const generateItineraryPlaceId = (
  item: ServerScheduleItem,
  dayIndex: number, // 0-based index of the day in the itinerary
  placeItemIndex: number // 0-based index of the place within the day
): string => {
  const serverPlaceIdStr = item.id !== undefined ? String(item.id) : undefined;
  const placeId = serverPlaceIdStr
    ? serverPlaceIdStr
    : `fallback_${item.place_name.replace(/\s+/g, '_')}_${dayIndex}_${placeItemIndex}`;

  if (item.id === undefined) {
    console.warn(
      `[generateItineraryPlaceId] Server item "${item.place_name}" is missing an ID. Using fallback ID "${placeId}".`
    );
  }
  return placeId;
};

/**
 * Creates an ItineraryPlaceWithTime object from a merged schedule item group and selected place details.
 */
export const mapToItineraryPlace = (
  group: { item: ServerScheduleItem; count: number },
  selectedPlaceDetails: CoreSelectedPlace | undefined,
  dayIndex: number,
  placeItemIndex: number
): ItineraryPlaceWithTime => {
  const item = group.item;
  const itineraryPlaceId = generateItineraryPlaceId(item, dayIndex, placeItemIndex);
  const isFallback = !selectedPlaceDetails;

  if (isFallback) {
      const serverPlaceIdStr = item.id !== undefined ? String(item.id) : undefined;
      console.warn(
        `[mapToItineraryPlace] Details for place "${item.place_name}" (Server ID: ${serverPlaceIdStr || 'N/A'}, Itinerary ID: ${itineraryPlaceId}) not found in local lists. Using default values. isFallback: true.`
      );
  }

  const stayDurationInMinutes = group.count * 60; // Assuming each item in schedule is 1 hour block

  const timeBlockSuffix = item.time_block.split('_')[1]; // e.g., "0900" from "Tue_0900"
  const arriveHour = timeBlockSuffix.substring(0, 2);
  const arriveMinute = timeBlockSuffix.substring(2, 4);
  const formattedArriveTime = `${arriveHour}:${arriveMinute}`;

  let departHourCalc = parseInt(arriveHour, 10);
  let departMinuteCalc = parseInt(arriveMinute, 10);
  
  departMinuteCalc += stayDurationInMinutes;
  departHourCalc += Math.floor(departMinuteCalc / 60);
  departMinuteCalc %= 60;
  departHourCalc %= 24; 
  
  const formattedDepartTime = `${departHourCalc.toString().padStart(2, '0')}:${departMinuteCalc.toString().padStart(2, '0')}`;

  return {
    id: itineraryPlaceId,
    name: item.place_name,
    category: selectedPlaceDetails?.category || item.place_type || 'unknown', // Ensure category is always a string
    timeBlock: formattedArriveTime, // Or item.time_block if preferred
    arriveTime: formattedArriveTime,
    departTime: formattedDepartTime,
    stayDuration: stayDurationInMinutes,
    travelTimeToNext: '', // To be filled later if needed
    
    // Ensure all required fields from Place have defaults
    x: selectedPlaceDetails?.x ?? 126.5312, // Default Jeju coordinates
    y: selectedPlaceDetails?.y ?? 33.4996,  // Default Jeju coordinates
    address: selectedPlaceDetails?.address ?? '정보 없음',
    road_address: selectedPlaceDetails?.road_address ?? '정보 없음', // Provide default for road_address
    phone: selectedPlaceDetails?.phone ?? '정보 없음', // Provide default for phone
    description: selectedPlaceDetails?.description ?? '', // Default to empty string
    rating: selectedPlaceDetails?.rating ?? 0, // Default to 0
    image_url: selectedPlaceDetails?.image_url ?? '', // Default to empty string
    homepage: selectedPlaceDetails?.homepage ?? '', // Default to empty string
    naverLink: selectedPlaceDetails?.naverLink ?? '', // Add naverLink
    instaLink: selectedPlaceDetails?.instaLink ?? '', // Add instaLink
    
    geoNodeId: selectedPlaceDetails?.geoNodeId || itineraryPlaceId,
    isFallback: isFallback,
    
    // Optional fields also from SelectedPlace if available
    isSelected: selectedPlaceDetails?.isSelected, 
    isCandidate: selectedPlaceDetails?.isCandidate,
  };
};
