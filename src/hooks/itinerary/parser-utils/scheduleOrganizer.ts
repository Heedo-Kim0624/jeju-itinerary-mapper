
import { ServerScheduleItem } from '@/types/core';

/**
 * Organizes schedule items by day and sorts them by time_block.
 * "시작" items come first, then time-based items, then "끝" items.
 * @param schedule The array of server schedule items.
 * @returns A Map where keys are day strings (e.g., "Mon") and values are sorted arrays of schedule items for that day.
 * The Map itself is not guaranteed to be sorted chronologically by day key here.
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
    items.sort((a, b) => {
      const timePartA = a.time_block.split('_')[1];
      const timePartB = b.time_block.split('_')[1];

      // Handle "시작" and "끝"
      if (timePartA === '시작') return -1;
      if (timePartB === '시작') return 1;
      if (timePartA === '끝') return 1;
      if (timePartB === '끝') return -1;

      // Handle numeric times (e.g., "09", "0900", "12")
      // Pad with '00' if only HH is present (e.g. "09" -> "0900") to ensure correct comparison
      const numericTimeA = parseInt(timePartA.padEnd(4, '0'), 10);
      const numericTimeB = parseInt(timePartB.padEnd(4, '0'), 10);

      if (isNaN(numericTimeA) && isNaN(numericTimeB)) return 0; // both are non-standard
      if (isNaN(numericTimeA)) return 1; // non-standard timePartA comes after
      if (isNaN(numericTimeB)) return -1; // non-standard timePartB comes after

      return numericTimeA - numericTimeB;
    });
    scheduleByDay.set(dayKey, items); // Update the map with sorted items
  });

  return scheduleByDay;
};
