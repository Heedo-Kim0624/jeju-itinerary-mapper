
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

