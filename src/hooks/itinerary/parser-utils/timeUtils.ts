
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
