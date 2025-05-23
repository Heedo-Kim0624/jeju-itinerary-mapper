
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
  allPlacesMapByName: Map<string, Place>, // 추가된 인자
  getPlaceDetailsByIdCallback: (id: number) => DetailedPlace | PlaceData | undefined // 추가된 인자
): ItineraryPlaceWithTime => {
  const item = group.item;
  let resolvedNumericId: number | null = null;
  let resolvedPlaceDetails: Place | DetailedPlace | PlaceData | undefined = undefined;

  // 1. 서버에서 온 ID를 파싱 시도
  if (item.id !== undefined && String(item.id).toLowerCase() !== 'n/a') {
    resolvedNumericId = parseIntId(item.id);
  }

  // 2. 파싱된 숫자 ID로 상세 정보 조회 시도
  if (resolvedNumericId !== null) {
    resolvedPlaceDetails = getPlaceDetailsByIdCallback(resolvedNumericId);
  }

  // 3. ID 기반 조회가 실패했거나 ID가 없었고, 이름 기반 매핑에서 장소를 찾았다면 해당 정보 사용
  if (!resolvedPlaceDetails && item.place_name) {
    const placeFromNameMapping = allPlacesMapByName.get(item.place_name);
    if (placeFromNameMapping) {
      console.log(`[mapToItineraryPlace] 장소 "${item.place_name}"에 대해 이름 기반 매핑으로 ID "${placeFromNameMapping.id}" 찾음.`);
      resolvedPlaceDetails = placeFromNameMapping; // Place 타입
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

  // resolvedPlaceDetails의 타입에 따라 필드 접근
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
  let naverLink = '';
  let instaLink = '';
  let geoNodeId: string | number | undefined = itineraryPlaceId; // geoNodeId는 ItineraryPlaceWithTime에서 string | number | undefined
  
  if (resolvedPlaceDetails) {
    // Place 타입의 공통 필드
    name = resolvedPlaceDetails.name; // 이름은 resolvedPlaceDetails 우선
    category = resolvedPlaceDetails.category || item.place_type || 'unknown';
    x = resolvedPlaceDetails.x ?? x;
    y = resolvedPlaceDetails.y ?? y;
    address = resolvedPlaceDetails.address ?? address;
    road_address = resolvedPlaceDetails.road_address ?? road_address;
    phone = resolvedPlaceDetails.phone ?? phone;
    description = resolvedPlaceDetails.description ?? description;
    rating = resolvedPlaceDetails.rating ?? rating;
    image_url = resolvedPlaceDetails.image_url ?? image_url;
    homepage = resolvedPlaceDetails.homepage ?? homepage;
    naverLink = resolvedPlaceDetails.naverLink ?? naverLink;
    instaLink = resolvedPlaceDetails.instaLink ?? instaLink;

    // DetailedPlace 타입에만 있는 필드 (존재한다면 사용)
    if ('link_url' in resolvedPlaceDetails && (resolvedPlaceDetails as DetailedPlace).link_url) {
        homepage = homepage || (resolvedPlaceDetails as DetailedPlace).link_url!;
    }
    if ('geoNodeId' in resolvedPlaceDetails && (resolvedPlaceDetails as DetailedPlace).geoNodeId) {
        geoNodeId = (resolvedPlaceDetails as DetailedPlace).geoNodeId;
    }
    // PlaceData 타입에만 있는 필드 (존재한다면 사용, DetailedPlace와 겹치지 않는 선에서)
    // 예: if ('categories_details' in resolvedPlaceDetails) { description = description || (resolvedPlaceDetails as PlaceData).categories_details; }
  }


  return {
    id: itineraryPlaceId, // 최종 생성된 유니크 ID
    name: resolvedPlaceDetails?.name || item.place_name, // 상세정보 이름 우선
    category: category,
    timeBlock: item.time_block, // 서버에서 온 원본 time_block 유지 또는 formattedArriveTime 사용 결정 필요
    arriveTime: formattedArriveTime,
    departTime: formattedDepartTime,
    stayDuration: stayDurationInMinutes,
    travelTimeToNext: '', 
    
    x, y, address, road_address, phone, description, rating, image_url, homepage, naverLink, instaLink,
    
    geoNodeId: typeof geoNodeId === 'number' ? String(geoNodeId) : geoNodeId, // geoNodeId를 string으로 통일하거나, 타입 그대로 유지
    isFallback: isFallback,
    numericDbId: resolvedNumericId, // 복원된 숫자 ID

    // Optional fields
    // isSelected, isCandidate 등은 CoreSelectedPlace에서 오지만, 현재 CoreSelectedPlace를 직접 받지 않음.
    // 필요하다면 resolvedPlaceDetails에서 이 정보를 가져오도록 추가 구현.
  };
};
