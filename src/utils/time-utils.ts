
import { addMinutes, format } from 'date-fns';

// 이동 시간을 추정하는 함수 (거리에 기반한 간단한 추정)
export const estimateTravelTime = (distance: number): number => {
  // 거리(km)에 따라 소요 시간(분) 추정 
  // 평균 속도 40km/h로 가정 (40km/60min = 0.667km/min)
  return Math.ceil(distance / 0.667);
};

// 시간대 블록을 결정하는 함수
export const getTimeBlock = (day: number, hour: number): string => {
  if (hour < 12) return `${day}일차 오전`;
  if (hour < 17) return `${day}일차 오후`;
  return `${day}일차 저녁`;
};

// 특정 장소에서 머무는 시간을 카테고리별로 계산
export const getStayTime = (category: string): number => {
  switch (category) {
    case 'accommodation':
      return 30; // 숙소에서 30분 머무른다고 가정
    case 'attraction':
      return 60; // 관광지에서 1시간 머무른다고 가정
    case 'restaurant':
      return 90; // 식당에서 1시간 30분 머무른다고 가정
    case 'cafe':
      return 60; // 카페에서 1시간 머무른다고 가정
    default:
      return 45; // 기본 장소에서 45분 머무른다고 가정
  }
};

// 현재 시간 객체에 이동 시간을 추가
export const addTravelTime = (currentTime: Date, travelTime: number): Date => {
  return addMinutes(currentTime, travelTime);
};

// 현재 시간 객체에 체류 시간을 추가
export const addStayTime = (currentTime: Date, category: string): Date => {
  return addMinutes(currentTime, getStayTime(category));
};

// 시간을 HH:MM 형식으로 포맷팅
export const formatTimeToString = (time: Date): string => {
  return format(time, 'HH:mm');
};
