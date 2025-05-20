
import { format, addMinutes } from 'date-fns';

// 이동 시간을 추정하는 함수 (거리에 기반한 간단한 추정)
export const estimateTravelTime = (distance: number): number => {
  // 거리(km)에 따라 소요 시간(분) 추정
  // 평균 속도 40km/h로 가정 (40km/60min = 0.667km/min or 1km takes 1.5 min)
  return Math.ceil(distance * 1.5); // Simplified: 1km approx 1.5 mins
};

// 시간대 블록을 결정하는 함수
export const getTimeBlock = (day: number, hour: number): string => {
  if (hour < 12) return `${day}일차 오전`;
  if (hour < 17) return `${day}일차 오후`;
  return `${day}일차 저녁`;
};

// Helper function to format time
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

// Helper function to add travel time and return new date
export const addTravelTime = (currentTime: Date, travelTimeMinutes: number): Date => {
  return addMinutes(currentTime, travelTimeMinutes);
};
