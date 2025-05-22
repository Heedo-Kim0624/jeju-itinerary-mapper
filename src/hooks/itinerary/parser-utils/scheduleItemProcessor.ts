
import { ServerScheduleItem } from '@/types/core';
import { CoreSelectedPlace } from '@/types/core';
import { SchedulePayload } from '@/types/core';
import { parseIntId, isSameId } from '@/utils/id-utils';

/**
 * Processes a single server item to find matched place details and extract relevant information
 */
export const getProcessedItemDetails = (
  serverItem: ServerScheduleItem,
  lastPayload: SchedulePayload | null,
  currentSelectedPlaces: CoreSelectedPlace[]
): {
  item: ServerScheduleItem;
  details: CoreSelectedPlace | undefined;
  numericId: number | null;
  isFallback: boolean;
  name: string;
  category: string;
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
} => {
  let placeIdToMatch: string | number | null = null;
  let matchSource: string | null = null;
  const serverItemIdInt = parseIntId(serverItem.id);

  if (lastPayload) {
    if (serverItemIdInt !== null) {
      const foundInSelected = lastPayload.selected_places?.find(p => isSameId(p.id, serverItemIdInt));
      if (foundInSelected) {
        placeIdToMatch = foundInSelected.id;
        matchSource = 'selected_places (ID 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidate = lastPayload.candidate_places?.find(p => isSameId(p.id, serverItemIdInt));
        if (foundInCandidate) {
          placeIdToMatch = foundInCandidate.id;
          matchSource = 'candidate_places (ID 매칭)';
        }
      }
    }

    if (!placeIdToMatch && serverItem.place_name) {
      const foundInSelectedByName = lastPayload.selected_places?.find(p => p.name === serverItem.place_name);
      if (foundInSelectedByName) {
        placeIdToMatch = foundInSelectedByName.id;
        matchSource = 'selected_places (이름 매칭)';
      }
      if (!placeIdToMatch) {
        const foundInCandidateByName = lastPayload.candidate_places?.find(p => p.name === serverItem.place_name);
        if (foundInCandidateByName) {
          placeIdToMatch = foundInCandidateByName.id;
          matchSource = 'candidate_places (이름 매칭)';
        }
      }
    }
  }
  
  const numericIdFromPayload = parseIntId(placeIdToMatch);
  let placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, numericIdFromPayload ?? placeIdToMatch ?? serverItemIdInt));

  if (!placeDetails && serverItemIdInt !== null) { // Fallback to serverItemIdInt if payload match failed
      placeDetails = currentSelectedPlaces.find(p => isSameId(p.id, serverItemIdInt));
      if (placeDetails && !placeIdToMatch) { // If found using serverItemIdInt directly
         placeIdToMatch = serverItem.id; // Ensure placeIdToMatch is set
         matchSource = 'currentSelectedPlaces (서버 ID 직접 매칭)';
      }
  }
  
  const finalNumericId = parseIntId(placeDetails?.id ?? placeIdToMatch ?? serverItem.id);

  if (placeDetails) {
    return {
      item: serverItem,
      details: placeDetails,
      numericId: finalNumericId,
      isFallback: false,
      name: placeDetails.name,
      category: placeDetails.category || mapServerTypeToCategory(serverItem.place_type || '기타'),
      x: placeDetails.x,
      y: placeDetails.y,
      address: placeDetails.address,
      road_address: placeDetails.road_address || placeDetails.address,
      phone: placeDetails.phone || 'N/A',
      description: placeDetails.description || '',
      rating: placeDetails.rating || 0,
      image_url: placeDetails.image_url || '',
      homepage: placeDetails.homepage || '',
      geoNodeId: placeDetails.geoNodeId,
    };
  }

  // Fallback if no details found
  return {
    item: serverItem,
    details: undefined,
    numericId: finalNumericId, // Attempt to parse serverItem.id if nothing else found
    isFallback: true,
    name: serverItem.place_name || '정보 없음',
    category: mapServerTypeToCategory(serverItem.place_type || '기타'),
    x: 126.5, 
    y: 33.4,  
    address: '제주특별자치도 (정보 부족)',
    road_address: '제주특별자치도 (정보 부족)',
    phone: 'N/A',
    description: '상세 정보 없음',
    rating: 0,
    image_url: '',
    homepage: '',
    geoNodeId: undefined,
  };
};

/**
 * Maps server type to category
 */
const mapServerTypeToCategory = (serverType: string): string => {
  // Basic mapping, expand as needed
  if (serverType === 'attraction') return '관광지';
  if (serverType === 'restaurant') return '음식점';
  if (serverType === 'cafe') return '카페';
  if (serverType === 'accommodation') return '숙소';
  return '기타'; // Default category
};
