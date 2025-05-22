
/**
 * Creates mapping of day of week keys to consecutive day numbers
 * @param dayKeys Array of day keys (e.g., ['Mon', 'Tue', 'Wed'])
 * @returns Object mapping day keys to numbers (e.g., { 'Mon': 1, 'Tue': 2, ... })
 */
export const createDayMapping = (dayKeys: string[]): Record<string, number> => {
  const dayMapping: Record<string, number> = {};
  const dayOrder = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5, 'Sat': 6, 'Sun': 7 };
  
  const sortedDayKeys = [...dayKeys].sort((a, b) => {
    return (dayOrder[a as keyof typeof dayOrder] || 8) - (dayOrder[b as keyof typeof dayOrder] || 8);
  });
  
  sortedDayKeys.forEach((dayKey, index) => {
    dayMapping[dayKey] = index + 1; 
  });
  
  return dayMapping;
};
