
import { ServerScheduleItem, SelectedPlace as CoreSelectedPlace, Place, SchedulePayload } from '@/types/core'; // Use CoreSelectedPlace for payload items
import { parseIntId, isSameId } from '@/utils/id-utils';

/**
 * Processes a single server item to find matched place details and extract relevant information
 */
export const getProcessedItemDetails = (
  serverItem: ServerScheduleItem,
  lastPayload: SchedulePayload | null,
  getPlaceById: (id: number | string | null | undefined) => Place | undefined,
  getPlaceByName: (name: string) => Place | undefined,
  currentSelectedPlacesOriginal: CoreSelectedPlace[] // For ID hints from payload
): {
  item: ServerScheduleItem;
  // details: Place | undefined; // Changed to Place from Supabase
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
  isFallback: boolean;
  numericId: number | null; // The ID used for matching from the store
  geoNodeId?: string;
  // Raw Place object from store for flexibility in placeGroupCreator
  placeFromStore?: Place; 
} => {
  let placeDetails: Place | undefined = undefined;
  let matchedNumericId: number | null = null;
  
  const serverItemIdStr = serverItem.id !== undefined ? String(serverItem.id) : undefined;
  const serverItemIdNum = parseIntId(serverItemIdStr);

  // Priority 1: Try to match ID from serverItem directly with the global store
  if (serverItemIdNum !== null) {
    placeDetails = getPlaceById(serverItemIdNum);
    if (placeDetails) {
      matchedNumericId = serverItemIdNum;
      console.log(`[ProcItem] Matched server place "${serverItem.place_name}" (ID: ${serverItemIdNum}) directly from global store.`);
    }
  }

  // Priority 2: If no match by ID, try to match by name using the global store
  if (!placeDetails && serverItem.place_name) {
    placeDetails = getPlaceByName(serverItem.place_name);
    if (placeDetails) {
      // If matched by name, use the ID from the found placeDetails
      matchedNumericId = parseIntId(placeDetails.id); 
      console.log(`[ProcItem] Matched server place "${serverItem.place_name}" by name from global store. Found ID: ${matchedNumericId}`);
    }
  }
  
  // Priority 3: Use lastPayload and currentSelectedPlacesOriginal for ID hints if global store match failed
  // This logic attempts to find an ID that *might* exist in the global store,
  // even if the serverItem.id or place_name didn't directly match.
  if (!placeDetails && lastPayload) {
    let hintedIdToTry: string | number | null = null;
    const serverItemPlaceName = serverItem.place_name;

    // Check selected_places in lastPayload
    const foundInSelected = lastPayload.selected_places?.find(p => 
        (serverItemIdNum !== null && isSameId(p.id, serverItemIdNum)) || 
        (serverItemPlaceName && p.name === serverItemPlaceName)
    );
    if (foundInSelected) hintedIdToTry = foundInSelected.id;

    // Check candidate_places in lastPayload
    if (!hintedIdToTry) {
        const foundInCandidate = lastPayload.candidate_places?.find(p => 
            (serverItemIdNum !== null && isSameId(p.id, serverItemIdNum)) ||
            (serverItemPlaceName && p.name === serverItemPlaceName)
        );
        if (foundInCandidate) hintedIdToTry = foundInCandidate.id;
    }
    
    // Check currentSelectedPlacesOriginal (legacy selected places before this call)
    if(!hintedIdToTry) {
        const foundInOriginal = currentSelectedPlacesOriginal?.find(p =>
            (serverItemIdNum !== null && isSameId(p.id, serverItemIdNum)) ||
            (serverItemPlaceName && p.name === serverItemPlaceName)
        );
        if (foundInOriginal) hintedIdToTry = foundInOriginal.id;
    }

    if (hintedIdToTry) {
        const hintedNumericId = parseIntId(hintedIdToTry);
        if (hintedNumericId !== null) {
            const placeFromHint = getPlaceById(hintedNumericId);
            if (placeFromHint) {
                placeDetails = placeFromHint;
                matchedNumericId = hintedNumericId;
                console.log(`[ProcItem] Matched server place "${serverItem.place_name}" using ID hint (${hintedNumericId}) from payload/original selection, found in global store.`);
            }
        }
    }
  }


  if (placeDetails && matchedNumericId !== null) {
    return {
      item: serverItem,
      // details: placeDetails,
      numericId: matchedNumericId, // Use the ID that successfully fetched from store
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
      placeFromStore: placeDetails, // Pass the full object
    };
  }

  // Fallback if no details found in global store even after hints
  console.warn(`[ProcItem] Fallback for server place "${serverItem.place_name}" (Server ID: ${serverItemIdStr}). No details in global store.`);
  return {
    item: serverItem,
    // details: undefined,
    numericId: serverItemIdNum, // Use original server ID if parsed, or null
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
    placeFromStore: undefined,
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
