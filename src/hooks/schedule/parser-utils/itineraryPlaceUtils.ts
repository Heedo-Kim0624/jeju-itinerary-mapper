
import { Place, ItineraryPlaceWithTime, CategoryName, SelectedPlace, ServerScheduleItem, SchedulePayload } from '@/types/core';
import { isSameId, parseIntId } from '@/utils/id-utils'; // Assuming these are correctly defined

// Helper: Extract time from "Mon_0900" -> "09:00"
const extractTime = (timeBlock: string): string => {
  const parts = timeBlock.split('_');
  const timeStr = parts.length > 1 ? parts[1] : parts[0]; // "0900"
  if (timeStr && timeStr.length === 4) {
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`; // "09:00"
  }
  return "00:00"; // Fallback
};

// Helper: Calculate departure time
const calculateDepartureTime = (arriveTime: string, stayDurationMinutes: number = 60): string => {
  if (!arriveTime || !arriveTime.includes(':')) return "00:00";
  const [hours, minutes] = arriveTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + stayDurationMinutes);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

// Helper: Map server place type to CategoryName
const mapServerTypeToAppCategory = (serverPlaceType?: string): CategoryName => {
  if (!serverPlaceType) return '기타';
  // This mapping needs to be robust, ensure it covers all server types
  // and maps them to your app's CategoryName correctly.
  switch (serverPlaceType.toLowerCase()) {
    case 'accommodation':
    case '숙박': // Assuming server might send Korean
      return '숙소';
    case 'attraction':
    case '관광':
      return '관광지';
    case 'restaurant':
    case '음식점':
      return '음식점';
    case 'cafe':
    case '카페':
      return '카페';
    case 'transport':
    case '교통':
      return '교통';
    default:
      return '기타';
  }
};

// determineFinalId adapted from useItineraryParser
const determineFinalId = (
    originalId: string | number | undefined | null, 
    fallbackNamePrefix: string, 
    itemIndex: number, 
    dayNumber: number
): string | number => {
    if (originalId !== null && originalId !== undefined) {
        if (typeof originalId === 'number') {
            return originalId;
        }
        if (typeof originalId === 'string') {
            const numericId = parseInt(originalId, 10);
            if (!isNaN(numericId) && String(numericId) === originalId) {
                return numericId;
            }
            return originalId; // It's a non-numeric string ID
        }
    }
    // Fallback: generate a string ID if originalId is null, undefined, or an unexpected type
    return `${fallbackNamePrefix.replace(/\s+/g, '_')}_${itemIndex}_day${dayNumber}_gen`;
};


/**
 * Creates an ItineraryPlaceWithTime object from a server schedule item.
 * This function attempts to find full place details from currentSelectedPlaces
 * or uses information from serverItem and lastPayload as fallback.
 */
export const createPlaceWithTimeFromSchedule = (
  serverItem: ServerScheduleItem,
  dayNumber: number, // Added for ID generation uniqueness if needed
  itemIndex: number, // Added for ID generation uniqueness
  currentSelectedPlaces: SelectedPlace[], // Full details of places known to client
  lastPayload: SchedulePayload | null // Payload sent to server, for matching by name/id
): ItineraryPlaceWithTime => {
  let matchedPlaceDetails: SelectedPlace | undefined;
  let idToUse: string | number | undefined | null = serverItem.id; // Start with server ID

  // 1. Try to match serverItem.id with lastPayload to get the original client ID
  let clientMatchedId: string | number | null = null;
  if (lastPayload && serverItem.id !== undefined) {
    const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverItem.id));
    if (foundInSelected) clientMatchedId = foundInSelected.id;
    if (!clientMatchedId) {
      const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverItem.id));
      if (foundInCandidate) clientMatchedId = foundInCandidate.id;
    }
  }
  
  // If clientMatchedId found, use that to look up in currentSelectedPlaces
  if (clientMatchedId !== null) {
    matchedPlaceDetails = currentSelectedPlaces.find(p => isSameId(p.id, clientMatchedId));
    idToUse = clientMatchedId; // Prioritize client's original ID
  } else if (serverItem.id !== undefined) {
    // If no match via payload, try serverItem.id directly in currentSelectedPlaces
    matchedPlaceDetails = currentSelectedPlaces.find(p => isSameId(p.id, serverItem.id));
  }


  // If still no details by ID, try matching by name (less reliable)
  if (!matchedPlaceDetails && serverItem.place_name) {
      matchedPlaceDetails = currentSelectedPlaces.find(p => p.name === serverItem.place_name);
      if (matchedPlaceDetails) idToUse = matchedPlaceDetails.id;
  }

  const arriveTimeStr = extractTime(serverItem.time_block);
  const departTimeStr = calculateDepartureTime(arriveTimeStr, serverItem.stay_duration_minutes || 60);

  const finalDeterminedId = determineFinalId(idToUse, serverItem.place_name || 'unknown', itemIndex, dayNumber);

  if (matchedPlaceDetails) {
    return {
      id: finalDeterminedId,
      name: matchedPlaceDetails.name,
      category: matchedPlaceDetails.category || mapServerTypeToAppCategory(serverItem.place_type),
      timeBlock: serverItem.time_block,
      arriveTime: arriveTimeStr,
      departTime: departTimeStr,
      stayDuration: serverItem.stay_duration_minutes || 60,
      travelTimeToNext: serverItem.route_info_to_next?.duration_str || '정보 없음',
      x: matchedPlaceDetails.x,
      y: matchedPlaceDetails.y,
      address: matchedPlaceDetails.address,
      road_address: matchedPlaceDetails.road_address || matchedPlaceDetails.address,
      phone: matchedPlaceDetails.phone || '정보 없음',
      description: matchedPlaceDetails.description || '',
      rating: matchedPlaceDetails.rating || 0,
      image_url: matchedPlaceDetails.image_url || '',
      homepage: matchedPlaceDetails.homepage || '',
      geoNodeId: matchedPlaceDetails.geoNodeId,
      isFallback: false,
    };
  }

  // Fallback if no details found
  return {
    id: finalDeterminedId,
    name: serverItem.place_name || '이름 정보 없음',
    category: mapServerTypeToAppCategory(serverItem.place_type),
    timeBlock: serverItem.time_block,
    arriveTime: arriveTimeStr,
    departTime: departTimeStr,
    stayDuration: serverItem.stay_duration_minutes || 60,
    travelTimeToNext: serverItem.route_info_to_next?.duration_str || '정보 없음',
    x: serverItem.x ?? 126.5, // Use server provided coords if available, else default
    y: serverItem.y ?? 33.4,
    address: '주소 정보 없음',
    road_address: '도로명 주소 정보 없음',
    phone: '전화번호 정보 없음',
    description: '상세 정보 없음',
    rating: 0,
    image_url: '',
    homepage: '',
    isFallback: true, // Mark as fallback
  };
};

