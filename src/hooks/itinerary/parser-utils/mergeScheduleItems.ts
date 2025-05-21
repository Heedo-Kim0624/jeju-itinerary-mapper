
import { ServerScheduleItem } from '@/types/core';

/**
 * Merges consecutive identical schedule items based on id and place_name.
 * Each merged group includes the original item and a count of occurrences.
 */
export const mergeScheduleItems = (
  scheduleItems: ServerScheduleItem[]
): { item: ServerScheduleItem; count: number }[] => {
  if (!scheduleItems || scheduleItems.length === 0) {
    return [];
  }

  const mergedItems: { item: ServerScheduleItem; count: number }[] = [];
  let currentGroup = { item: scheduleItems[0], count: 1 };

  for (let i = 1; i < scheduleItems.length; i++) {
    if (
      scheduleItems[i].id === currentGroup.item.id &&
      scheduleItems[i].place_name === currentGroup.item.place_name
    ) {
      currentGroup.count++;
    } else {
      mergedItems.push(currentGroup);
      currentGroup = { item: scheduleItems[i], count: 1 };
    }
  }
  mergedItems.push(currentGroup); // Add the last group

  return mergedItems;
};
