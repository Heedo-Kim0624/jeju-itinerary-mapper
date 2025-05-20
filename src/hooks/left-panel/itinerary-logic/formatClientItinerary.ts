
import { ItineraryDay as CoreItineraryDay } from '@/types/core';
import { getDateStringMMDD, getDayOfWeekString } from '@/hooks/itinerary/itineraryUtils';

/**
 * Formats the output from the client-side itinerary creator.
 * This function ensures that dayOfWeek, date are set based on the startDate and index,
 * and that routeData and interleaved_route have default values if not provided.
 * This mirrors the transformation logic previously in use-itinerary-actions.tsx.
 * @param creatorOutputDays The raw output from useItineraryCreator's createItinerary.
 * @param startDate The start date of the trip.
 * @returns A formatted array of ItineraryDay objects.
 */
export const formatClientItinerary = (
  creatorOutputDays: CoreItineraryDay[],
  startDate: Date
): CoreItineraryDay[] => {
  if (!creatorOutputDays || creatorOutputDays.length === 0) {
    return [];
  }

  return creatorOutputDays.map((dayData, index) => {
    const currentDayDt = new Date(startDate);
    currentDayDt.setDate(startDate.getDate() + index);
    return {
      ...dayData,
      dayOfWeek: getDayOfWeekString(currentDayDt),
      date: getDateStringMMDD(currentDayDt),
      routeData: dayData.routeData || { nodeIds: [], linkIds: [], segmentRoutes: [] },
      interleaved_route: dayData.interleaved_route || [],
    };
  });
};
