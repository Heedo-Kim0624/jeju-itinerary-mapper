
import { Place } from '@/types/supabase';

export interface PlaceWithUsedFlag extends Place {
  usedInItinerary?: boolean;
}

// 빈 스케줄 테이블 생성
export const createEmptyScheduleTable = (
  startDate: Date,
  startTime: string,
  endDate: Date,
  endTime: string
): Record<string, Place | null> => {
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 9);
  const table: Record<string, Place | null> = {};

  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  days.forEach(day => {
    hours.forEach(hour => {
      const key = `${day}_${hour}시`;
      table[key] = null;
    });
  });
  
  return table;
};

// 가장 가까운 장소 찾기
export const findNearestPlace = (
  currentPlace: Place,
  remainingPlaces: PlaceWithUsedFlag[],
  calculateDistance: (p1: Place, p2: Place) => number
): PlaceWithUsedFlag | null => {
  if (remainingPlaces.length === 0) return null;
  
  const availablePlaces = remainingPlaces.filter(p => !p.usedInItinerary);
  if (availablePlaces.length === 0) return null;
  
  let nearestPlace = availablePlaces[0];
  let minDistance = calculateDistance(currentPlace, nearestPlace);
  
  for (let i = 1; i < availablePlaces.length; i++) {
    const distance = calculateDistance(currentPlace, availablePlaces[i]);
    if (distance < minDistance) {
      minDistance = distance;
      nearestPlace = availablePlaces[i];
    }
  }
  
  return nearestPlace;
};

// 장소 분류 및 플래그 추가
export const categorizeAndFlagPlaces = (places: Place[]): Record<string, PlaceWithUsedFlag[]> => {
  const placesByCategory: Record<string, PlaceWithUsedFlag[]> = {};
  
  places.forEach(place => {
    const category = place.category || '';
    if (!placesByCategory[category]) {
      placesByCategory[category] = [];
    }
    placesByCategory[category].push({ ...place, usedInItinerary: false });
  });
  
  return placesByCategory;
};

// 카테고리별 시간대 배정 조건 확인
export const isCategoryTimeSlotCompatible = (category: string, hour: number): boolean => {
  switch (category) {
    case 'restaurant':
      // 식당: 12시 또는 13시, 18시 또는 19시에 배치
      return hour === 12 || hour === 13 || hour === 18 || hour === 19;
    
    case 'attraction':
      // 관광지: 09-11시, 14-17시, 20-21시에 배치
      return (hour >= 9 && hour <= 11) || 
             (hour >= 14 && hour <= 17) || 
             (hour >= 20 && hour <= 21);
    
    case 'cafe':
      // 카페: 13시 또는 14시에 배치
      return hour === 13 || hour === 14;
    
    case 'accommodation':
      // 숙소: 모든 시간 가능 (단, 실제 구현시 체크인/체크아웃 시간 고려 필요)
      return true;
    
    default:
      return true;
  }
};

// 장소 간의 거리 계산
export const calculateDistance = (p1: Place, p2: Place): number => {
  // 두 지점 간 직선 거리 계산 (Haversine formula)
  const R = 6371; // 지구 반경 (km)
  if (!p1?.x || !p1?.y || !p2?.x || !p2?.y) return 0;
  
  const dLat = (p2.y - p1.y) * Math.PI / 180;
  const dLon = (p2.x - p1.x) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(p1.y * Math.PI / 180) * Math.cos(p2.y * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // km 단위 거리
};

// 일정의 총 거리 계산
export const calculateTotalDistance = (places: Place[]): number => {
  if (places.length <= 1) return 0;
  
  let totalDistance = 0;
  for (let i = 0; i < places.length - 1; i++) {
    totalDistance += calculateDistance(places[i], places[i+1]);
  }
  
  return parseFloat(totalDistance.toFixed(2)); // 소수점 2자리까지
};

// 후보지 수 계산
export const calculateCandidatePlacesCounts = (numDays: number) => {
  return {
    attractionCount: 4 * numDays,  // 관광지: 4n개
    restaurantCount: 3 * numDays,  // 음식점: 3n개
    cafeCount: 3 * numDays,        // 카페: 3n개
  };
};

// 후보지 준비 함수
export const prepareCandidatePlaces = (
  selectedPlaces: Place[],
  recommendedPlaces: Place[],
  numDays: number
): Place[] => {
  // 선택된 장소를 카테고리별로 분류
  const categorizedSelected = selectedPlaces.reduce((acc, place) => {
    const category = place.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(place);
    return acc;
  }, {} as Record<string, Place[]>);
  
  // 추천 장소를 카테고리별로 분류
  const categorizedRecommended = recommendedPlaces.reduce((acc, place) => {
    const category = place.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(place);
    return acc;
  }, {} as Record<string, Place[]>);
  
  // 카테고리별 필요한 장소 수 계산
  const { attractionCount, restaurantCount, cafeCount } = calculateCandidatePlacesCounts(numDays);
  
  // 필요한 후보지 추가
  const candidatePlaces: Place[] = [];
  
  // 관광지 후보 추가
  addCandidatesForCategory(
    'attraction',
    candidatePlaces,
    categorizedSelected['attraction'] || [],
    categorizedRecommended['attraction'] || [],
    attractionCount
  );
  
  // 식당 후보 추가
  addCandidatesForCategory(
    'restaurant',
    candidatePlaces,
    categorizedSelected['restaurant'] || [],
    categorizedRecommended['restaurant'] || [],
    restaurantCount
  );
  
  // 카페 후보 추가
  addCandidatesForCategory(
    'cafe',
    candidatePlaces,
    categorizedSelected['cafe'] || [],
    categorizedRecommended['cafe'] || [],
    cafeCount
  );
  
  return candidatePlaces;
};

// 특정 카테고리의 후보지 추가
const addCandidatesForCategory = (
  category: string,
  candidatePlaces: Place[],
  selectedOfCategory: Place[],
  recommendedOfCategory: Place[],
  requiredCount: number
) => {
  // 이미 선택된 장소의 수
  const selectedCount = selectedOfCategory.length;
  
  // 필요한 추가 후보지 수
  const additionalNeeded = Math.max(0, requiredCount - selectedCount);
  
  if (additionalNeeded > 0) {
    // 이미 선택되지 않은 추천 장소만 필터링
    const notSelectedRecommended = recommendedOfCategory.filter(rec => 
      !selectedOfCategory.some(sel => sel.id === rec.id)
    );
    
    // 추천 장소를 weight 기준으로 정렬
    const sortedRecommended = [...notSelectedRecommended].sort((a, b) => {
      const weightA = a.weight || 0;
      const weightB = b.weight || 0;
      return weightB - weightA;
    });
    
    // 필요한 만큼만 후보지에 추가
    const candidates = sortedRecommended.slice(0, additionalNeeded);
    candidatePlaces.push(...candidates);
  }
};
