
import { ServerScheduleItem } from '@/types/core';

/**
 * Organizes schedule items by day and sorts them by time_block.
 * @param schedule The array of server schedule items.
 * @returns A Map where keys are day strings (e.g., "Mon") and values are sorted arrays of schedule items for that day.
 */
export const organizeAndSortScheduleByDay = (schedule: ServerScheduleItem[]): Map<string, ServerScheduleItem[]> => {
  const scheduleByDay = new Map<string, ServerScheduleItem[]>();

  if (!schedule) {
    return scheduleByDay;
  }

  // Organize schedule items by day
  schedule.forEach(item => {
    const dayKey = item.time_block.split('_')[0]; // e.g., "Mon" from "Mon_0900"
    if (!scheduleByDay.has(dayKey)) {
      scheduleByDay.set(dayKey, []);
    }
    scheduleByDay.get(dayKey)?.push(item);
  });

  // Sort items within each day by time_block
  scheduleByDay.forEach((items, dayKey) => {
    items.sort((a, b) => a.time_block.localeCompare(b.time_block));
    scheduleByDay.set(dayKey, items);
  });

  return scheduleByDay;
};
