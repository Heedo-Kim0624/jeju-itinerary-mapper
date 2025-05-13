
import { format, addMinutes } from 'date-fns';

export const useItineraryTime = () => {
  // 이동 시간을 추정하는 함수 (거리에 기반한 간단한 추정)
  const estimateTravelTime = (distance: number): number => {
    // 거리(km)에 따라 소요 시간(분) 추정 
    // 평균 속도 40km/h로 가정 (40km/60min = 0.667km/min)
    return Math.ceil(distance / 0.667);
  };

  // 시간대 블록을 결정하는 함수
  const getTimeBlock = (day: number, hour: number): string => {
    if (hour < 12) return `${day}일차 오전`;
    if (hour < 17) return `${day}일차 오후`;
    return `${day}일차 저녁`;
  };

  return {
    estimateTravelTime,
    getTimeBlock
  };
};
