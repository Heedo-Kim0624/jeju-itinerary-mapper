
/**
 * Extracts time from timeBlock string
 * @param timeBlock Format like "Mon_0900" or "0900" 
 * @returns Formatted time string "09:00"
 */
export const extractTimeFromTimeBlock = (timeBlock: string): string => {
  // Assumes timeBlock is like "Mon_0900" or "0900"
  const parts = timeBlock.split('_');
  const timeStr = parts.length > 1 ? parts[1] : parts[0];
  if (timeStr && timeStr.length === 4) {
    return `${timeStr.substring(0, 2)}:${timeStr.substring(2, 4)}`;
  }
  return "00:00"; // Fallback
};

/**
 * Calculates departure time based on arrival time and stay duration
 * @param arriveTime Arrival time in "HH:MM" format
 * @param stayDurationMinutes Stay duration in minutes
 * @returns Formatted departure time "HH:MM"
 */
export const calculateDepartTime = (arriveTime: string, stayDurationMinutes: number): string => {
  if (!arriveTime || !arriveTime.includes(':')) return "00:00";
  const [hours, minutes] = arriveTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  date.setMinutes(date.getMinutes() + stayDurationMinutes);
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
};

/**
 * Formats date for display in itinerary
 * @param baseDate Base date object
 * @param dayOffset Number of days to offset from base date
 * @returns Formatted date string "MM/DD"
 */
export const formatDate = (baseDate: Date | null, dayOffset: number): string => {
  if (!baseDate) {
    const today = new Date();
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + dayOffset);
    return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
  }
  
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + dayOffset);
  return `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`;
};

/**
 * Calculates formatted travel time string based on minutes
 * @param travelTimeMinutes Travel time in minutes
 * @returns Formatted travel time string (e.g., "30분" or "1시간 30분")
 */
export const formatTravelTime = (travelTimeMinutes: number): string => {
  if (!travelTimeMinutes || travelTimeMinutes <= 0) return "-";
  
  const hours = Math.floor(travelTimeMinutes / 60);
  const minutes = travelTimeMinutes % 60;
  
  if (hours === 0) {
    return `${minutes}분`;
  } else if (minutes === 0) {
    return `${hours}시간`;
  } else {
    return `${hours}시간 ${minutes}분`;
  }
};

/**
 * Extracts day of week from timeBlock string
 * @param timeBlock Format like "Mon_0900"
 * @returns Day of week string or empty string if not found
 */
export const extractDayOfWeekFromTimeBlock = (timeBlock: string): string => {
  const parts = timeBlock.split('_');
  return parts.length > 1 ? parts[0] : '';
};

/**
 * Gets day of week string for a date
 * @param date Date object
 * @returns Day of week string (e.g., "Mon", "Tue", etc.)
 */
export const getDayOfWeekString = (date: Date): string => {
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return daysOfWeek[date.getDay()];
};

/**
 * Gets date string in MM/DD format
 * @param date Date object
 * @returns Date string in MM/DD format
 */
export const getDateStringMMDD = (date: Date): string => {
  return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}`;
};

/**
 * Estimates travel time between two points based on distance
 * @param distanceKm Distance in kilometers
 * @returns Estimated travel time in minutes
 */
export const estimateTravelTimeFromDistance = (distanceKm: number): number => {
  // Assuming average speed of 40km/h (roughly 0.67km per minute)
  const avgSpeedKmPerMinute = 0.67;
  return Math.round(distanceKm / avgSpeedKmPerMinute);
};
