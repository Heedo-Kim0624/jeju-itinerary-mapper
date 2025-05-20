
import { SelectedPlace, ItineraryPlaceWithTime, CategoryName, ServerScheduleItem } from '@/types/core';

// Helper: 서버 스케줄 아이템과 선택된 장소 정보를 바탕으로 ItineraryPlaceWithTime 객체를 생성
export function createPlaceWithTimeFromSchedule(
  placeName: string,
  placeIndexInRoute: number,
  dayAbbrev: string, // 예: "Mon", "Tue" - 스케줄 아이템 필터링에 사용
  scheduleItems: ServerScheduleItem[],
  currentSelectedPlaces: SelectedPlace[]
): ItineraryPlaceWithTime {
  const matchingScheduleItem = scheduleItems.find(sItem => 
    sItem.place_name === placeName && sItem.time_block.startsWith(dayAbbrev)
  );

  const existingPlaceInfo = currentSelectedPlaces.find(p => p.name === placeName);
  
  let timeStr = '';
  if (matchingScheduleItem) {
    const timeBlockParts = matchingScheduleItem.time_block.split('_');
    timeStr = timeBlockParts.length > 1 ? timeBlockParts[timeBlockParts.length -1] : ''; // 마지막 부분을 시간으로 가정
    if (timeStr === '시작' || timeStr === '끝') {
        // 특별한 시간 문자열은 그대로 사용
    } else {
        // 숫자 시간 문자열은 그대로 사용 (예: '09', '14')
    }
  } else {
    console.warn(`[createPlaceWithTimeFromSchedule] No schedule item found for place: ${placeName} in day starting with ${dayAbbrev}.`);
  }

  const baseId = existingPlaceInfo?.id || placeIndexInRoute;
  const placeId = typeof baseId === 'number' ? String(baseId) : baseId;

  return {
    id: placeId,
    name: placeName,
    category: (matchingScheduleItem?.place_type || existingPlaceInfo?.category || 'unknown') as CategoryName,
    timeBlock: timeStr, // 'HH' 형식 또는 '시작', '끝'
    x: existingPlaceInfo?.x || 0,
    y: existingPlaceInfo?.y || 0,
    address: existingPlaceInfo?.address || '',
    phone: existingPlaceInfo?.phone || '',
    description: existingPlaceInfo?.description || '',
    rating: existingPlaceInfo?.rating || 0,
    image_url: existingPlaceInfo?.image_url || '',
    road_address: existingPlaceInfo?.road_address || '',
    homepage: existingPlaceInfo?.homepage || '',
    // isSelected, isCandidate는 ItineraryPlaceWithTime에 없으므로 SelectedPlace의 필드를 직접 참조하지 않음.
    // 필요하다면 ItineraryPlaceWithTime 타입에 추가해야 함.
    // arriveTime, departTime 등은 서버 응답에 따라 채워지거나, 후처리 단계에서 계산될 수 있음.
    // 현재 구조에서는 timeBlock을 arriveTime의 근사값으로 사용.
    arriveTime: timeStr, 
    geoNodeId: placeId,
  };
}
