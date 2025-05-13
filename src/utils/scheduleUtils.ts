
import { format, isWithinInterval, parse, addDays } from 'date-fns';
import { Place } from '@/types/supabase';
import { calculateDistance, calculateTotalDistance, isCategoryTimeSlotCompatible } from './schedule';

// 장소 인터페이스에 영업 시간 정보 추가
interface PlaceWithOperationTime extends Place {
  operationTimeData?: {
    [key: string]: number; // 요일_시간: 0(영업안함), 1(영업중), 999(정보없음)
  };
  nodeId?: string;
}

// 스케줄 테이블 인터페이스
export interface ScheduleTable {
  [dayHour: string]: Place | null; // 요일_시간: Place 객체 또는 null
}

// 일정 점수 인터페이스
export interface ItineraryScore {
  score: number;
  totalDistance: number;
  placesCount: number;
}

// 일정 일자 인터페이스
export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

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
      
      // 조건에 맞는 경우에만 테이블에 추가
      if (shouldInclude) {
        table[dayHour] = null;
      }
    }
  }
  
  return table;
};

/**
 * 장소의 영업 시간 체크
 * 
 * @param place 장소 객체
 * @param dayHour 요일_시간 형식의 문자열 (예: '월_12시')
 * @returns 해당 시간에 영업 중인지 여부
 */
export const isPlaceOpenAt = (place: PlaceWithOperationTime, dayHour: string): boolean => {
  if (!place.operationTimeData) {
    return true; // 영업 시간 데이터가 없으면 항상 영업 중으로 간주
  }
  
  const operationStatus = place.operationTimeData[dayHour];
  
  // 0: 영업 안함, 1: 영업 중, 999: 정보 없음
  if (operationStatus === 0) {
    return false;
  }
  
  return true; // 1 또는 999인 경우
};

/**
 * 일정 점수 계산
 * 
 * @param places 일정에 포함된 장소 배열
 * @returns 일정 점수 객체
 */
export const calculateItineraryScore = (places: Place[]): ItineraryScore => {
  // 모든 장소가 일정에 포함되면 기본 1000점
  const baseScore = 1000;
  
  // 총 이동 거리 계산
  const totalDistance = calculateTotalDistance(places);
  
  // 이동 거리에 따른 감점 (거리 km × -0.001)
  const distancePenalty = totalDistance * -0.001;
  
  // 최종 점수 계산
  const score = baseScore + distancePenalty;
  
  return {
    score,
    totalDistance,
    placesCount: places.length
  };
};

/**
 * 최적 일정 생성 (간단한 구현, 실제 강화학습 알고리즘은 통합 시 교체 필요)
 * 
 * @param places 장소 배열
 * @param startDate 여행 시작 날짜
 * @param endDate 여행 종료 날짜
 * @returns 최적화된 일정 일자 배열
 */
export const createOptimizedItinerary = (
  places: Place[],
  startDate: Date,
  endDate: Date,
  startTime: string,
  endTime: string
): ItineraryDay[] => {
  // 여행 일수 계산
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const numDays = Math.max(1, daysDiff);
  
  // 빈 스케줄 테이블 생성
  const scheduleTable = createEmptyScheduleTable(startDate, startTime, endDate, endTime);
  
  // 카테고리별 장소 분류
  const placesByCategory: Record<string, Place[]> = {
    restaurant: [],
    cafe: [],
    attraction: [],
    accommodation: []
  };
  
  places.forEach(place => {
    const category = place.category || 'other';
    if (placesByCategory[category]) {
      placesByCategory[category].push(place);
    } else {
      placesByCategory[category] = [place];
    }
  });
  
  // 일자별 일정
  const itinerary: ItineraryDay[] = [];
  
  // 각 일자마다 일정 생성
  for (let day = 1; day <= numDays; day++) {
    const currentDate = addDays(startDate, day - 1);
    const dayPlaces: Place[] = [];
    
    // 이 부분은 실제 강화학습 알고리즘으로 대체 가능
    // 현재는 단순히 카테고리별로 순차 배치
    
    // 숙소를 첫 번째로 추가 (있는 경우)
    if (placesByCategory.accommodation.length > 0) {
      const accommodation = placesByCategory.accommodation[0];
      dayPlaces.push(accommodation);
    }
    
    // 관광지 추가 (오전)
    const morningAttractions = placesByCategory.attraction.slice(0, 1);
    dayPlaces.push(...morningAttractions);
    
    // 식당 추가 (점심)
    const lunchRestaurant = placesByCategory.restaurant.slice(0, 1);
    dayPlaces.push(...lunchRestaurant);
    
    // 카페 추가
    const cafe = placesByCategory.cafe.slice(0, 1);
    dayPlaces.push(...cafe);
    
    // 오후 관광지 추가
    const afternoonAttractions = placesByCategory.attraction.slice(1, 2);
    dayPlaces.push(...afternoonAttractions);
    
    // 식당 추가 (저녁)
    const dinnerRestaurant = placesByCategory.restaurant.slice(1, 2);
    dayPlaces.push(...dinnerRestaurant);
    
    // 경로 거리 계산
    const totalDistance = calculateTotalDistance(dayPlaces);
    
    itinerary.push({
      day,
      places: dayPlaces,
      totalDistance
    });
    
    // 이미 사용한 장소는 제거
    placesByCategory.accommodation = placesByCategory.accommodation.slice(1);
    placesByCategory.attraction = placesByCategory.attraction.slice(2);
    placesByCategory.restaurant = placesByCategory.restaurant.slice(2);
    placesByCategory.cafe = placesByCategory.cafe.slice(1);
  }
  
  return itinerary;
};
