
import { ServerScheduleItem, SelectedPlace as CoreSelectedPlace, ItineraryPlaceWithTime, Place } from '@/types/core'; // Place 추가
import { mergeScheduleItems } from './mergeScheduleItems';
import { findPlaceDetails } from './placeDetailFinder'; // 이 함수는 내부적으로 이름 기반 검색을 이미 포함하고 있을 수 있으나, ID 복원을 위해 직접 allPlacesMapByName 사용
import { mapToItineraryPlace } from './itineraryPlaceMapper';
import type { DetailedPlace } from '@/types/detailedPlace';
import type { PlaceData } from '@/hooks/data/useSupabaseDataFetcher';

/**
 * Builds grouped itinerary places from server schedule items, enriching with local details.
 */
export const buildGroupedItineraryPlaces = (
  serverScheduleItems: ServerScheduleItem[],
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | PlaceData | undefined,
  dayNumber: number, // Changed from dayIndex to dayNumber for clarity matching ItineraryDay.day
  allPlacesMapByName: Map<string, Place> // 추가된 인자
): ItineraryPlaceWithTime[] => {
  if (!serverScheduleItems || serverScheduleItems.length === 0) {
    return [];
  }

  const mergedItems = mergeScheduleItems(serverScheduleItems);
  
  console.log(`[buildGroupedItineraryPlaces] Day ${dayNumber} - Merged server items:`, mergedItems);

  const itineraryPlaces = mergedItems.map((mergedGroup, index) => {
    const serverItem = mergedGroup.item;
    
    // ID를 먼저 시도하고, 없으면 이름으로 상세 정보 찾기 (이 부분은 mapToItineraryPlace로 이전)
    // let placeDetails: CoreSelectedPlace | undefined;
    // const serverPlaceIdStr = serverItem.id !== undefined ? String(serverItem.id) : undefined;

    // if (serverPlaceIdStr && serverPlaceIdStr !== 'N/A') {
    //   const numericId = parseInt(serverPlaceIdStr, 10);
    //   if (!isNaN(numericId)) {
    //     const detailsFromCallback = getPlaceDetailsByIdCallback(numericId);
    //     // Convert DetailedPlace | PlaceData to CoreSelectedPlace if necessary, or adapt mapToItineraryPlace
    //     // For now, assuming mapToItineraryPlace can handle DetailedPlace | PlaceData or we adapt it.
    //   }
    // }
    // // findPlaceDetails는 SelectedPlace 타입 반환을 기대하나, 우리는 Place 또는 DetailedPlace를 가지고 있음.
    // // 우선 mapToItineraryPlace에서 직접 처리하도록 수정.

    // mapToItineraryPlace 호출 시 allPlacesMapByName 전달
    return mapToItineraryPlace(
      mergedGroup,
      undefined, // selectedPlaceDetails는 mapToItineraryPlace 내부에서 처리하도록 변경
      dayNumber, 
      index,
      allPlacesMapByName, // 추가된 인자
      getPlaceDetailsByIdCallback // 상세 정보 조회 콜백 전달
    );
  });
  
  console.log(`[buildGroupedItineraryPlaces] Day ${dayNumber} - Final itinerary places:`, itineraryPlaces);
  return itineraryPlaces;
};
