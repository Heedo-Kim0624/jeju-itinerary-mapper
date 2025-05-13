
import { Place } from '@/types/supabase';

/**
 * 여행 기간(일수)에 따른 카테고리별 필요 장소 수를 계산합니다.
 */
export const calculateRequiredPlaces = (tripDuration: number) => {
  if (!tripDuration || tripDuration < 1) return {
    accommodation: 0,
    landmark: 0,
    restaurant: 0,
    cafe: 0
  };

  return {
    accommodation: tripDuration, // n박 = n개 숙소
    landmark: 4 * tripDuration,  // 하루 평균 4개 관광지
    restaurant: 3 * tripDuration, // 하루 평균 3끼
    cafe: 3 * tripDuration       // 하루 평균 3개 카페
  };
};

/**
 * 부족한 카테고리별 장소 수만큼 후보지를 추가합니다.
 */
export const addCandidatePlaces = (
  selectedPlaces: {
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  },
  recommendedPlacesByCategory: {
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  },
  tripDuration: number | null
): Place[] => {
  if (!tripDuration || tripDuration < 1) {
    console.warn('유효한 여행 기간이 없어 후보지를 추가할 수 없습니다.');
    return [];
  }

  // 카테고리별 필요 장소 수 계산
  const required = calculateRequiredPlaces(tripDuration);
  
  console.log('카테고리별 필요 장소 수:', required);
  console.log('현재 선택된 장소 수:', {
    '숙소': selectedPlaces['숙소'].length,
    '관광지': selectedPlaces['관광지'].length,
    '음식점': selectedPlaces['음식점'].length,
    '카페': selectedPlaces['카페'].length,
  });

  // 이미 선택된 장소의 ID 세트를 만듦
  const selectedIds = new Set<string>();
  Object.values(selectedPlaces).flat().forEach(place => {
    selectedIds.add(place.id.toString());
  });

  // 후보지 리스트 (선택된 장소도 포함해야 함)
  const candidates: Place[] = [
    ...selectedPlaces['숙소'],
    ...selectedPlaces['관광지'],
    ...selectedPlaces['음식점'],
    ...selectedPlaces['카페']
  ];

  // 음식점 후보지 추가
  if (selectedPlaces['음식점'].length < required.restaurant) {
    const needed = required.restaurant - selectedPlaces['음식점'].length;
    addCandidatesFromCategory(
      '음식점',
      recommendedPlacesByCategory['음식점'],
      needed,
      selectedIds,
      candidates
    );
  }

  // 관광지 후보지 추가
  if (selectedPlaces['관광지'].length < required.landmark) {
    const needed = required.landmark - selectedPlaces['관광지'].length;
    addCandidatesFromCategory(
      '관광지',
      recommendedPlacesByCategory['관광지'],
      needed,
      selectedIds,
      candidates
    );
  }

  // 카페 후보지 추가
  if (selectedPlaces['카페'].length < required.cafe) {
    const needed = required.cafe - selectedPlaces['카페'].length;
    addCandidatesFromCategory(
      '카페',
      recommendedPlacesByCategory['카페'],
      needed,
      selectedIds,
      candidates
    );
  }

  // 숙소는 사용자가 직접 선택한 것만 사용 (후보 없음)

  console.log(`총 ${candidates.length}개의 장소가 준비되었습니다 (선택: ${selectedIds.size}개, 후보: ${candidates.length - selectedIds.size}개)`);
  return candidates;
};

/**
 * 특정 카테고리에서 필요한 수만큼 후보지를 추가합니다.
 */
function addCandidatesFromCategory(
  category: string,
  recommendedPlaces: Place[],
  neededCount: number,
  selectedIds: Set<string>,
  candidates: Place[]
) {
  // 가중치 기준으로 정렬 (높은 순)
  const sortedPlaces = [...recommendedPlaces]
    .sort((a, b) => (b.weight || 0) - (a.weight || 0));
  
  let added = 0;
  
  for (const place of sortedPlaces) {
    // 이미 선택된 장소는 건너뛰기
    if (selectedIds.has(place.id.toString())) {
      continue;
    }
    
    // 후보지에 추가하고 ID 세트에도 추가
    candidates.push({
      ...place,
      isRecommended: true  // 후보지임을 표시
    });
    selectedIds.add(place.id.toString());
    
    added++;
    
    // 필요한 수만큼 추가했으면 종료
    if (added >= neededCount) {
      break;
    }
  }
  
  console.log(`${category}: ${added}/${neededCount}개의 후보 장소가 추가되었습니다.`);
}

/**
 * 여행 일정 생성을 위한 페이로드를 준비합니다.
 * 선택된 장소와 후보 장소를 포함합니다.
 */
export const prepareSchedulePayload = (
  selectedPlaces: {
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  },
  recommendedPlacesByCategory: {
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  },
  tripDuration: number | null,
  dateTime: { start_datetime: string; end_datetime: string } | null
) => {
  if (!dateTime) {
    console.error('여행 날짜와 시간 정보가 없습니다.');
    return null;
  }

  // 전체 선택된 장소 목록 (이미 선택된 장소)
  const allSelectedPlaces = [
    ...selectedPlaces['숙소'],
    ...selectedPlaces['관광지'],
    ...selectedPlaces['음식점'],
    ...selectedPlaces['카페']
  ];

  // 선택된 장소 ID를 추적 (중복 방지)
  const selectedPlaceIds = new Set(allSelectedPlaces.map(place => place.id.toString()));

  // 후보 장소 생성 (이 함수는 이미 선택된 장소도 포함하도록 수정됨)
  const allCandidatePlaces = addCandidatePlaces(
    selectedPlaces,
    recommendedPlacesByCategory,
    tripDuration
  );

  // 이미 선택된 장소를 제외한 실제 후보 장소만 추출
  const candidatePlacesOnly = allCandidatePlaces.filter(place => 
    !selectedPlaceIds.has(place.id.toString()) && place.isRecommended
  );

  return {
    selected_places: allSelectedPlaces.map(place => ({ 
      id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id,
      name: place.name
    })),
    candidate_places: candidatePlacesOnly.map(place => ({ 
      id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id,
      name: place.name
    })),
    start_datetime: dateTime.start_datetime,
    end_datetime: dateTime.end_datetime
  };
};
