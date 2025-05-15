
/**
 * Calculate the number of days between two date strings
 * @param startDate - Start date in ISO format or any valid date string
 * @param endDate - End date in ISO format or any valid date string
 * @returns Number of days between the dates including both start and end date
 */
export const calculateDaysBetween = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Reset time part to get accurate date difference
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);
  
  // Calculate the difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime());
  
  // Convert to days and add 1 to include both start and end dates
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  
  return diffDays;
};
