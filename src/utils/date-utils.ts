
/**
 * Formats a Date object or a date string into MM/DD string format.
 * @param date - The date to format (Date object, or string like YYYY-MM-DD).
 * @returns The formatted date string (e.g., "05/21").
 */
export const formatDateToMMDD = (date: Date | string | null | undefined): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const d = new Date(date);
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${month}/${day}`;
  } catch (e) {
    console.error("Error formatting date:", e);
    return 'N/A';
  }
};

/**
 * Gets the day of the week as a short string (e.g., "Mon", "Tue").
 * @param date - The date to get the day of the week from.
 * @returns The day of the week string.
 */
export const getDayOfWeekString = (date: Date | string | null | undefined): string => {
  if (!date) {
    return 'N/A';
  }
  try {
    const d = new Date(date);
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return days[d.getDay()];
  } catch (e) {
    console.error("Error getting day of week:", e);
    return 'N/A';
  }
};

/**
 * 시간 문자열을 포맷팅합니다 (예: "09:30").
 * @param timeString - 포맷팅할 시간 문자열 
 * @returns 포맷팅된 시간 문자열
 */
export const formatTimeString = (timeString: string | null | undefined): string => {
  if (!timeString) {
    return 'N/A';
  }
  
  // 이미 HH:MM 형식인 경우
  if (timeString.includes(':')) {
    return timeString;
  }
  
  // HHMM 형식인 경우 (예: "0900" -> "09:00")
  if (timeString.length === 4) {
    return `${timeString.substring(0, 2)}:${timeString.substring(2, 4)}`;
  }
  
  return timeString;
};

/**
 * 날짜를 MM/DD 형식으로 변환합니다.
 * @param date - 변환할 날짜
 * @returns MM/DD 형식의 문자열
 */
export const getDateStringMMDD = (date: Date | string | null | undefined): string => {
  return formatDateToMMDD(date);
};
