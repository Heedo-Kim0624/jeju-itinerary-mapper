
import { ServerScheduleItem, SelectedPlace as CoreSelectedPlace, ItineraryPlaceWithTime, Place } from '@/types/core'; // Place 추가
import { parseIntId } from '@/utils/id-utils'; // parseIntId 임포트
import type { DetailedPlace } from '@/types/detailedPlace'; // DetailedPlace 임포트
import type { PlaceData } from '@/hooks/data/useSupabaseDataFetcher'; // PlaceData 임포트

/**
 * Generates a unique ID for an itinerary place, falling back if server ID is missing.
 */
const generateItineraryPlaceId = (
  item: ServerScheduleItem,
  dayNumber: number, 
  placeItemIndex: number,
  resolvedId: string | number | null // 추가: 복원된 ID 또는 원래 서버 ID
): string => {
  const baseId = resolvedId ? String(resolvedId) : `fallback_${item.place_name.replace(/\s+/g, '_')}`;
  return `${baseId}_${dayNumber}_${placeItemIndex}`;
};

/**
 * Creates an ItineraryPlaceWithTime object from a merged schedule item group and selected place details.
 */
export const mapToItineraryPlace = (
  group: { item: ServerScheduleItem; count: number },
  _selectedPlaceDetails_unused: CoreSelectedPlace | undefined, // 이 인자는 이제 사용되지 않음
  dayNumber: number, // dayIndex에서 dayNumber로 변경
  placeItemIndex: number,
  allPlacesMapByName: Map<string, Place>, 
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | undefined // PlaceData 가능성 제거, Context기반으로 DetailedPlace만 반환
): ItineraryPlaceWithTime => {
  const item = group.item;
  let resolvedNumericId: number | null = null;
  // resolvedPlaceDetails 타입을 DetailedPlace | Place | undefined로 명확히 합니다.
  let resolvedPlaceDetails: DetailedPlace | Place | undefined = undefined;

  // 1. 서버에서 온 ID를 파싱 시도
  if (item.id !== undefined && String(item.id).toLowerCase() !== 'n/a') {
    resolvedNumericId = parseIntId(item.id);
  }

  // 2. 파싱된 숫자 ID로 상세 정보 조회 시도 (DetailedPlace 반환 기대)
  if (resolvedNumericId !== null) {
    resolvedPlaceDetails = getPlaceDetailsByIdCallback(resolvedNumericId);
  }

  // 3. ID 기반 조회가 실패했거나 ID가 없었고, 이름 기반 매핑에서 장소를 찾았다면 해당 정보 사용 (Place 반환)
  if (!resolvedPlaceDetails && item.place_name) {
    const placeFromNameMapping = allPlacesMapByName.get(item.place_name);
    if (placeFromNameMapping) {
      console.log(`[mapToItineraryPlace] 장소 "${item.place_name}"에 대해 이름 기반 매핑으로 ID "${placeFromNameMapping.id}" 찾음.`);
      resolvedPlaceDetails = placeFromNameMapping; // Place 타입
      // placeFromNameMapping.id는 string | number 일 수 있으므로 파싱
      resolvedNumericId = parseIntId(placeFromNameMapping.id); // ID도 업데이트
    }
  }
  
  // 최종적으로 사용할 ID 결정 (resolvedNumericId가 있으면 그것, 아니면 서버의 원본 ID)
  const finalUsedIdForGenerator = resolvedNumericId !== null ? resolvedNumericId : (item.id !== undefined && String(item.id).toLowerCase() !== 'n/a' ? String(item.id) : null);
  const itineraryPlaceId = generateItineraryPlaceId(item, dayNumber, placeItemIndex, finalUsedIdForGenerator);

  const isFallback = !resolvedPlaceDetails;

  if (isFallback) {
      console.warn(
        `[mapToItineraryPlace] Day ${dayNumber}, Item ${placeItemIndex}: 장소 "${item.place_name}" (서버 ID: ${item.id || 'N/A'}, 복원시도 ID: ${resolvedNumericId ?? '실패'}) 상세 정보를 찾지 못했습니다. 기본값을 사용합니다. isFallback: true.`
      );
  } else {
    console.log(`[mapToItineraryPlace] Day ${dayNumber}, Item ${placeItemIndex}: 장소 "${item.place_name}" (ID: ${resolvedNumericId}) 상세 정보 사용.`);
  }

  const stayDurationInMinutes = group.count * 60; 

  const timeBlockSuffix = item.time_block.split('_')[1]; 
  const arriveHour = timeBlockSuffix === "시작" || timeBlockSuffix === "끝" ? "00" : timeBlockSuffix.substring(0, 2);
  const arriveMinute = timeBlockSuffix === "시작" || timeBlockSuffix === "끝" ? "00" : timeBlockSuffix.substring(2, 4);
  const formattedArriveTime = timeBlockSuffix === "시작" || timeBlockSuffix === "끝" ? timeBlockSuffix : `${arriveHour}:${arriveMinute}`;


  let departHourCalc = parseInt(arriveHour, 10);
  let departMinuteCalc = parseInt(arriveMinute, 10);
  
  if (!isNaN(departHourCalc) && !isNaN(departMinuteCalc)) {
    departMinuteCalc += stayDurationInMinutes;
    departHourCalc += Math.floor(departMinuteCalc / 60);
    departMinuteCalc %= 60;
    departHourCalc %= 24; 
  }
  const formattedDepartTime = (timeBlockSuffix === "시작" || timeBlockSuffix === "끝" || isNaN(departHourCalc) || isNaN(departMinuteCalc)) 
    ? timeBlockSuffix 
    : `${departHourCalc.toString().padStart(2, '0')}:${departMinuteCalc.toString().padStart(2, '0')}`;

  // resolvedPlaceDetails의 타입에 따라 필드 접근 (let으로 변경하여 재할당 가능하게)
  let placeName = item.place_name; // 기본값은 서버에서 온 이름
  let category = item.place_type || 'unknown';
  let x = 126.5312; // Default Jeju coordinates
  let y = 33.4996;
  let address = '정보 없음';
  let road_address = '정보 없음';
  let phone = '정보 없음';
  let description = '';
  let rating = 0;
  let image_url = '';
  let homepage = '';
  let naverLink = ''; // DetailedPlace의 link_url 또는 Place의 naverLink
  let instaLink = ''; // DetailedPlace의 instagram_url 또는 Place의 instaLink
  let geoNodeId: string | number | undefined = itineraryPlaceId; 
  
  if (resolvedPlaceDetails) {
    placeName = resolvedPlaceDetails.name; // 상세정보 이름 우선
    category = resolvedPlaceDetails.category || item.place_type || 'unknown';
    x = resolvedPlaceDetails.x ?? x;
    y = resolvedPlaceDetails.y ?? y;
    address = resolvedPlaceDetails.address ?? address;
    road_address = resolvedPlaceDetails.road_address || road_address; // Place에는 있지만 DetailedPlace에는 optional
    phone = resolvedPlaceDetails.phone || phone; // Place에는 있지만 DetailedPlace에는 optional
    description = resolvedPlaceDetails.description || description; // Place에는 있지만 DetailedPlace에는 optional
    rating = resolvedPlaceDetails.rating || rating; // Place에는 있지만 DetailedPlace에는 optional
    image_url = resolvedPlaceDetails.image_url || image_url; // Place에는 있지만 DetailedPlace에는 optional
    homepage = resolvedPlaceDetails.homepage || homepage; // Place에는 있지만 DetailedPlace에는 optional
    
    // 타입에 따라 naverLink, instaLink, geoNodeId 설정
    if ('link_url' in resolvedPlaceDetails && resolvedPlaceDetails.link_url) { // DetailedPlace
        naverLink = resolvedPlaceDetails.link_url;
    } else if ('naverLink' in resolvedPlaceDetails && resolvedPlaceDetails.naverLink) { // Place
        naverLink = resolvedPlaceDetails.naverLink;
    }

    if ('instagram_url' in resolvedPlaceDetails && resolvedPlaceDetails.instagram_url) { // DetailedPlace
        instaLink = resolvedPlaceDetails.instagram_url;
    } else if ('instaLink' in resolvedPlaceDetails && resolvedPlaceDetails.instaLink) { // Place
        instaLink = resolvedPlaceDetails.instaLink;
    }
    
    if (resolvedPlaceDetails.geoNodeId) {
        geoNodeId = resolvedPlaceDetails.geoNodeId;
    }
  }


  return {
    id: itineraryPlaceId, 
    name: placeName, 
    category: category,
    timeBlock: item.time_block, 
    arriveTime: formattedArriveTime,
    departTime: formattedDepartTime,
    stayDuration: stayDurationInMinutes,
    travelTimeToNext: '', 
    
    x, y, address, road_address, phone, description, rating, image_url, homepage, naverLink, instaLink,
    
    geoNodeId: typeof geoNodeId === 'number' ? String(geoNodeId) : geoNodeId, 
    isFallback: isFallback,
    numericDbId: resolvedNumericId, 
  };
};
