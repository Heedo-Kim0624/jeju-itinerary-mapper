
import { ServerScheduleItem } from '@/types/core';
// SelectedPlace and SchedulePayload might not be needed here if all details come from global store
// import { SelectedPlace } from '@/types/core';
// import { SchedulePayload } from '@/types/core';
import { parseIntId } from '@/utils/id-utils';
import { usePlaceContext } from '@/contexts/PlaceContext'; // Import the context hook
import type { DetailedPlace } from '@/types/detailedPlace'; // Import DetailedPlace
import { toCategoryName } from '@/utils/typeConversionUtils';
import type { CategoryName } from '@/types/core';


// Define the return type for getProcessedItemDetails
interface ProcessedScheduleItemDetails {
  item: ServerScheduleItem;
  details: DetailedPlace | undefined; // Now uses DetailedPlace
  numericId: number | null;
  isFallback: boolean; // Indicates if we're using fallback data due to missing details
  // Core fields, derived from 'details' or fallback
  name: string;
  category: CategoryName; // This should be CategoryName type
  x: number;
  y: number;
  address: string;
  road_address: string;
  phone: string;
  description: string;
  rating: number;
  image_url: string;
  homepage: string;
  geoNodeId?: string;
}


/**
 * Processes a single server item to find matched place details and extract relevant information
 * This version uses the global PlaceContext for details.
 */
export const getProcessedItemDetails = (
  serverItem: ServerScheduleItem
  // lastPayload and currentSelectedPlaces are removed as we use global store
): ProcessedScheduleItemDetails => {
  const { getPlaceById, isLoadingPlaces } = usePlaceContext(); // Get access to the global place store

  const serverItemIdInt = parseIntId(serverItem.id);

  let placeDetails: DetailedPlace | undefined = undefined;

  if (serverItemIdInt !== null && !isLoadingPlaces) {
    placeDetails = getPlaceById(serverItemIdInt);
    if (!placeDetails) {
      // This log is important for debugging consistency between server schedule and place DB
      console.warn(`[scheduleItemProcessor] Place details not found in global store for ID ${serverItemIdInt} (Name: "${serverItem.place_name}"). This might indicate a data inconsistency or a new place not yet in the DB.`);
    }
  } else if (isLoadingPlaces && serverItemIdInt !== null) {
    console.warn(`[scheduleItemProcessor] Place store is still loading. Details for ID ${serverItemIdInt} (Name: "${serverItem.place_name}") might be temporarily unavailable.`);
  }


  if (placeDetails) {
    return {
      item: serverItem,
      details: placeDetails,
      numericId: placeDetails.id, // Should be number already
      isFallback: false,
      name: placeDetails.name,
      category: placeDetails.category, // Already CategoryName from DetailedPlace
      x: placeDetails.x,
      y: placeDetails.y,
      address: placeDetails.address,
      road_address: placeDetails.road_address || placeDetails.address,
      phone: placeDetails.phone || 'N/A',
      description: placeDetails.description || '',
      rating: placeDetails.rating || 0,
      image_url: placeDetails.image_url || '',
      homepage: placeDetails.homepage || placeDetails.link_url || '', // Prefer homepage, fallback to link_url
      geoNodeId: placeDetails.geoNodeId,
    };
  }

  // Fallback if no details found or store is loading
  const fallbackCategory = mapServerTypeToCategory(serverItem.place_type || '기타');
  return {
    item: serverItem,
    details: undefined,
    numericId: serverItemIdInt,
    isFallback: true,
    name: serverItem.place_name || '정보 없음',
    category: fallbackCategory,
    // Use longitude/latitude from ServerScheduleItem if available for fallback coordinates
    x: serverItem.longitude !== undefined ? (typeof serverItem.longitude === 'string' ? parseFloat(serverItem.longitude) : serverItem.longitude) : 126.57, // Default to Jeju City Hall approx.
    y: serverItem.latitude !== undefined ? (typeof serverItem.latitude === 'string' ? parseFloat(serverItem.latitude) : serverItem.latitude) : 33.49, // Default to Jeju City Hall approx.
    address: '주소 정보 없음 (상세 정보 누락)',
    road_address: '도로명 주소 정보 없음 (상세 정보 누락)',
    phone: 'N/A',
    description: '상세 정보 없음',
    rating: 0,
    image_url: '',
    homepage: '',
    geoNodeId: undefined, // No geoNodeId in fallback
  };
};

/**
 * Maps server place_type to a local CategoryName.
 * This ensures consistency in category naming.
 */
const mapServerTypeToCategory = (serverType: string): CategoryName => {
  // Match serverType to CategoryName values
  const typeLower = serverType?.toLowerCase();
  if (typeLower === 'accommodation' || typeLower === '숙박') return toCategoryName('숙소');
  if (typeLower === 'attraction' || typeLower === '관광') return toCategoryName('관광지');
  if (typeLower === 'restaurant' || typeLower === '음식') return toCategoryName('음식점');
  if (typeLower === 'cafe' || typeLower === '카페') return toCategoryName('카페');
  
  // Fallback based on keywords if specific types aren't matched
  if (typeLower?.includes('숙소') || typeLower?.includes('호텔') || typeLower?.includes('펜션')) return toCategoryName('숙소');
  if (typeLower?.includes('관광') || typeLower?.includes('명소')) return toCategoryName('관광지');
  if (typeLower?.includes('식당') || typeLower?.includes('맛집')) return toCategoryName('음식점');
  
  // If '기타' needs to be a distinct category, CategoryName type and related utils should be updated.
  // For now, toCategoryName will handle '기타' and convert it to its default (e.g., '관광지') with a warning.
  // If a specific fallback like '기타' -> '관광지' is desired without warning, handle it here explicitly.
  // console.warn(`[mapServerTypeToCategory] Unknown server place type: "${serverType}". Defaulting to "기타", which will be processed by toCategoryName.`);
  return toCategoryName(serverType, '관광지'); // Pass original serverType, toCategoryName will handle unknown/English. Default to '관광지'.
};

