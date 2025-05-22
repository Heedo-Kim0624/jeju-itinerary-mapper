
import { format, addMinutes } from 'date-fns';

/**
 * 거리를 기반으로 이동 시간을 추정합니다.
 * @param distance - 거리 (km 단위)
 * @returns 추정 이동 시간 (분 단위)
 */
export const estimateTravelTime = (distance: number): number => {
  // 평균 속도 40km/h로 가정 (1km당 약 1.5분 소요)
  return Math.ceil(distance * 1.5);
};

/**
 * 특정 요일과 시간에 해당하는 시간대 블록 문자열을 반환합니다.
 * @param day - 요일 번호 (예: 1일차, 2일차)
 * @param hour - 시간 (0-23시)
 * @returns 시간대 블록 문자열 (예: "1일차 오전")
 */
export const getTimeBlock = (day: number, hour: number): string => {
  if (hour < 12) return `${day}일차 오전`;
  if (hour < 17) return `${day}일차 오후`;
  return `${day}일차 저녁`;
};

/**
 * Date 객체를 'HH:mm' 형식의 문자열로 포맷합니다.
 * @param date - 포맷할 Date 객체
 * @returns 'HH:mm' 형식의 시간 문자열
 */
export const formatTime = (date: Date): string => {
  return format(date, 'HH:mm');
};

/**
 * 현재 시간에 지정된 분만큼 이동 시간을 더한 새로운 Date 객체를 반환합니다.
 * @param currentTime - 현재 시간 Date 객체
 * @param travelTimeMinutes - 더할 이동 시간 (분 단위)
 * @returns 이동 시간이 더해진 새로운 Date 객체
 */
export const addTravelTime = (currentTime: Date, travelTimeMinutes: number): Date => {
  return addMinutes(currentTime, travelTimeMinutes);
};

/**
 * 이동 시간을 사람이 읽기 쉬운 문자열로 포맷합니다.
 * @param minutes - 이동 시간 (분 단위)
 * @returns 포맷된 이동 시간 문자열 (예: "30분" 또는 "1시간 30분")
 */
export const formatTravelTimeString = (minutes: number): string => {
  if (!minutes || minutes <= 0) return "-";
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) {
    return `${remainingMinutes}분`;
  } else if (remainingMinutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${remainingMinutes}분`;
  }
};

/**
 * 주어진 Date와 시간 문자열을 결합하여 새로운 Date 객체를 생성합니다.
 * @param date - 기준 날짜
 * @param timeString - 시간 문자열 (HH:MM 형식)
 * @returns 날짜와 시간이 결합된 새로운 Date 객체
 */
export const combineDateAndTime = (date: Date, timeString: string): Date => {
  const result = new Date(date);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  result.setHours(hours, minutes, 0, 0);
  return result;
};

/**
 * 요일 문자열을 한국어로 변환합니다.
 * @param dayOfWeek - 영문 요일 문자열 (예: "Mon", "Tue")
 * @returns 한국어 요일 문자열 (예: "월", "화")
 */
export const getDayOfWeekKorean = (dayOfWeek: string): string => {
  const dayMap: Record<string, string> = {
    'Sun': '일',
    'Mon': '월',
    'Tue': '화',
    'Wed': '수',
    'Thu': '목',
    'Fri': '금',
    'Sat': '토'
  };
  
  return dayMap[dayOfWeek] || dayOfWeek;
};
