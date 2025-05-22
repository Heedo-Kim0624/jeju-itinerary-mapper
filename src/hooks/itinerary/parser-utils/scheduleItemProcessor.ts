
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
    // Use a more specific type guard. 'category' existing and being a string is a good indicator for DetailedPlace.
    const isDetailedPlace = 'category' in placeDetails && typeof (placeDetails as DetailedPlace).category === 'string';

    let name: string;
    let categoryValue: CategoryName;
    let x: number;
    let y: number;
    let address: string;
    let road_address: string;
    let phone: string;
    let description: string;
    let rating: number;
    let image_url: string;
    let homepage: string;
    let geoNodeId: string | undefined;

    if (isDetailedPlace) {
      const pd = placeDetails as DetailedPlace;
      name = pd.name || serverItem.place_name;
      categoryValue = pd.category;
      x = pd.x;
      y = pd.y;
      address = pd.address || '';
      road_address = pd.road_address || pd.address || '';
      phone = pd.phone || 'N/A';
      description = pd.description || '';
      rating = pd.rating || 0;
      image_url = pd.image_url || '';
      homepage = pd.homepage || pd.link_url || '';
      geoNodeId = pd.geoNodeId;
    } else {
      const pd = placeDetails as PlaceData;
      name = pd.place_name || serverItem.place_name;
      categoryValue = toCategoryName(serverItem.place_type || '관광지'); // PlaceData doesn't have 'category: CategoryName'
      x = pd.longitude;
      y = pd.latitude;
      address = pd.address || pd.road_address || '';
      road_address = pd.road_address || pd.address || '';
      phone = pd.phone || 'N/A';
      description = pd.categories_details || '';
      rating = pd.rating || 0;
      image_url = pd.image_url || ''; // Assuming PlaceData might have image_url added
      homepage = pd.link || '';
      geoNodeId = undefined; // PlaceData doesn't typically have geoNodeId
    }
    
    return {
      item: serverItem,
      details: placeDetails,
      numericId: serverItemIdInt,
      isFallback: false,
      name,
      category: categoryValue,
      x,
      y,
      address,
      road_address,
      phone,
      description,
      rating,
      image_url,
      homepage,
      geoNodeId,
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
  
  return toCategoryName(serverType, '관광지'); // Default to '관광지' if no match
};

