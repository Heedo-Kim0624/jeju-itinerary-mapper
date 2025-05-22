
import { ServerScheduleItem } from '@/types/core';
import { parseIntId } from '@/utils/id-utils';
import type { DetailedPlace } from '@/types/detailedPlace';
import { toCategoryName } from '@/utils/typeConversionUtils';
import type { CategoryName } from '@/types/core';
import { PlaceData } from '@/hooks/data/useSupabaseDataFetcher';

// Define the return type for getProcessedItemDetails
interface ProcessedScheduleItemDetails {
  item: ServerScheduleItem;
  details: DetailedPlace | PlaceData | undefined; // Can be DetailedPlace or our PlaceData
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
 * Processes a single server item using detailed place data from provided source
 * No longer uses context hook - receives place details as parameter
 */
export const getProcessedItemDetails = (
  serverItem: ServerScheduleItem,
  getPlaceDetails: (id: number) => DetailedPlace | PlaceData | undefined
): ProcessedScheduleItemDetails => {
  const serverItemIdInt = parseIntId(serverItem.id);

  let placeDetails: DetailedPlace | PlaceData | undefined = undefined;

  if (serverItemIdInt !== null) {
    placeDetails = getPlaceDetails(serverItemIdInt);
    if (!placeDetails) {
      // This log is important for debugging consistency between server schedule and place DB
      console.warn(`[scheduleItemProcessor] Place details not found for ID ${serverItemIdInt} (Name: "${serverItem.place_name}")`);
    }
  }

  if (placeDetails) {
    // Handle both DetailedPlace and PlaceData types
    const isDetailedPlace = 'category' in placeDetails;
    
    return {
      item: serverItem,
      details: placeDetails,
      numericId: serverItemIdInt,
      isFallback: false,
      name: placeDetails.name || placeDetails.place_name || serverItem.place_name,
      category: isDetailedPlace ? placeDetails.category : toCategoryName(serverItem.place_type || '관광지'),
      // Handle different property names between DetailedPlace and PlaceData
      x: isDetailedPlace ? placeDetails.x : placeDetails.longitude,
      y: isDetailedPlace ? placeDetails.y : placeDetails.latitude,
      address: placeDetails.address || '',
      road_address: placeDetails.road_address || placeDetails.address || '',
      phone: placeDetails.phone || 'N/A',
      description: isDetailedPlace ? placeDetails.description : (placeDetails.categories_details || ''),
      rating: placeDetails.rating || 0,
      image_url: isDetailedPlace ? placeDetails.image_url : '',
      homepage: isDetailedPlace ? (placeDetails.homepage || placeDetails.link_url || '') : 
                                (placeDetails.link || ''),
      geoNodeId: isDetailedPlace ? placeDetails.geoNodeId : undefined,
    };
  }

  // Fallback if no details found
  const fallbackCategory = mapServerTypeToCategory(serverItem.place_type || '기타');
  return {
    item: serverItem,
    details: undefined,
    numericId: serverItemIdInt,
    isFallback: true,
    name: serverItem.place_name || '정보 없음',
    category: fallbackCategory,
    x: 126.57, // Default to Jeju City Hall approx. longitude
    y: 33.49,  // Default to Jeju City Hall approx. latitude
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
  
  return toCategoryName(serverType, '관광지');
};
