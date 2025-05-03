
import { format, isWithinInterval, parse, addDays } from 'date-fns';
import { Place } from '@/types/supabase';
import { PlaceWithUsedFlag, ScheduleTable } from './schedule-types';

/**
 * 빈 스케줄 테이블 생성
 * 
 * @param startDate 여행 시작 날짜
 * @param startTime 여행 시작 시간
 * @param endDate 여행 종료 날짜
 * @param endTime 여행 종료 시간
 * @returns 빈 스케줄 테이블
 */
export const createEmptyScheduleTable = (
  startDate: Date,
  startTime: string, 
  endDate: Date,
  endTime: string
): ScheduleTable => {
  const days = ['월', '화', '수', '목', '금', '토', '일'];
  const hours = Array.from({ length: 13 }, (_, i) => i + 9); // 09시 ~ 21시
  const table: ScheduleTable = {};

  // 시작 시간과 종료 시간을 숫자로 변환
  const [startHour] = startTime.split(':').map(Number);
  const [endHour] = endTime.split(':').map(Number);
  
  // 시작 요일과 종료 요일 인덱스
  const startDayIndex = (startDate.getDay() + 6) % 7; // 월(0) ~ 일(6)로 변환
  const endDayIndex = (endDate.getDay() + 6) % 7;
  
  // 시작 요일과 종료 요일
  const startDay = days[startDayIndex];
  const endDay = days[endDayIndex];
  
  // 모든 요일과 시간 조합으로 테이블 생성
  for (let d = 0; d < 7; d++) {
    const dayName = days[d];
    
    for (let h of hours) {
      const dayHour = `${dayName}_${h}시`;
      
      // 시작 요일/시간 이전이나 종료 요일/시간 이후인 칸은 제외
      let shouldInclude = true;
      
      // 시작 요일인 경우, 시작 시간 이전은 제외
      if (dayName === startDay && h < startHour) {
        shouldInclude = false;
      }
      
      // 종료 요일인 경우, 종료 시간 이후는 제외
      if (dayName === endDay && h > endHour) {
        shouldInclude = false;
      }
      
      // 시작일과 종료일 사이에 해당 요일이 없는 경우 제외
      // (구현 필요 - 현재는 간소화된 버전)
      
      // 조건에 맞는 경우에만 테이블에 추가
      if (shouldInclude) {
        table[dayHour] = null;
      }
    }
  }
  
  return table;
};

/**
 * 카테고리별 시간대 배정 조건 확인
 * 
 * @param category 장소 카테고리
 * @param hour 시간 (09 ~ 21)
 * @returns 해당 시간에 배치 가능 여부
 */
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

/**
 * 장소의 영업 시간 체크
 * 
 * @param place 장소 객체
 * @param dayHour 요일_시간 형식의 문자열 (예: '월_12시')
 * @returns 해당 시간에 영업 중인지 여부
 */
export const isPlaceOpenAt = (place: Place, dayHour: string): boolean => {
  // Fix: Check if the place has operationTimeData property before accessing it
  if (!place.operatingHours || typeof place.operatingHours !== 'object') {
    return true; // 영업 시간 데이터가 없으면 항상 영업 중으로 간주
  }
  
  // Assume operatingHours has the data structure we need
  const operatingHoursObj = place.operatingHours as Record<string, number>;
  const operationStatus = operatingHoursObj[dayHour];
  
  // 0: 영업 안함, 1: 영업 중, 999: 정보 없음
  if (operationStatus === 0) {
    return false;
  }
  
  return true; // 1 또는 999인 경우
};

/**
 * 가장 가까운 장소 찾기
 * 
 * @param currentPlace 현재 장소
 * @param remainingPlaces 남은 장소 배열
 * @param calculateDistance 거리 계산 함수
 * @returns 가장 가까운 장소 또는 null
 */
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

/**
 * 카테고리별로 장소를 분류하고 usedInItinerary 플래그 추가
 * 
 * @param places 장소 배열
 * @returns 카테고리별 장소 객체
 */
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
