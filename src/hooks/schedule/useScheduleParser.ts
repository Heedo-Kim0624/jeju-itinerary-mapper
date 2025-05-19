
import { useCallback, useMemo } from 'react';
// Removed CategoryName import from '@/utils/categoryUtils'
import { 
  Place, 
  ItineraryDay, 
  ItineraryPlaceWithTime, 
  NewServerScheduleResponse, 
  ServerScheduleItem,
  ServerRouteSummaryItem,
  isNewServerScheduleResponse,
  RouteData,
  CategoryName, // Assuming English category names are used internally if needed
  toCategoryName // For converting string category types
} from '@/types';
import { format, parseISO, addDays, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';

const dayOfWeekMapping: { [key: number]: string } = {
  0: "Sun", 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat",
};

// Helper to parse "HH:MM - HH:MM" or "HH:MM 도착"
const parseTimeBlock = (timeBlock: string): { arriveTime?: string, departTime?: string, stayDuration?: number } => {
  const parts = timeBlock.split(' - ');
  if (parts.length === 2) {
    const arriveTime = parts[0];
    const departTime = parts[1];
    // Calculate stay duration if possible (simple difference in minutes)
    try {
      const arriveDate = new Date(`1970-01-01T${arriveTime}:00`);
      const departDate = new Date(`1970-01-01T${departTime}:00`);
      const durationMillis = departDate.getTime() - arriveDate.getTime();
      if (!isNaN(durationMillis) && durationMillis >= 0) {
        return { arriveTime, departTime, stayDuration: Math.round(durationMillis / (1000 * 60)) };
      }
    } catch (e) { /* ignore date parsing errors */ }
    return { arriveTime, departTime };
  } else if (timeBlock.endsWith(" 도착")) {
    return { arriveTime: timeBlock.replace(" 도착", "") };
  }
  return {};
};


export const useScheduleParser = (allPlaces: Place[], startDateTime: string | null) => {
  const findPlaceByName = useCallback((name: string): Place | undefined => {
    return allPlaces.find(p => p.name === name);
  }, [allPlaces]);

  const parseSchedule = useCallback((
    response: NewServerScheduleResponse | any,
    startDateISO: string
  ): ItineraryDay[] | null => {
    if (!isNewServerScheduleResponse(response)) {
      console.error("Invalid schedule response format:", response);
      return null;
    }

    const startDate = parseISO(startDateISO);
    const itineraryDays: ItineraryDay[] = [];
    const scheduleByDay: { [dayStr: string]: ItineraryPlaceWithTime[] } = {};

    // Group places by day from response.schedule
    response.schedule.forEach((item: ServerScheduleItem, index: number) => {
      const placeDetail = findPlaceByName(item.place_name);
      if (!placeDetail) {
        console.warn(`Place not found: ${item.place_name}`);
        return;
      }

      // Assuming time_block implies the day relative to start_datetime
      // This needs a robust way to determine which day an item belongs to.
      // For now, we'll rely on route_summary to structure days.
      // If schedule items had a day field, that would be better.
      // Let's try to infer day from route_summary's interleaved_route
    });
    
    // Structure based on route_summary
    response.route_summary.forEach((daySummary: ServerRouteSummaryItem, dayIndex: number) => {
      const currentDate = addDays(startDate, dayIndex);
      const dayOfWeekNumber = getDay(currentDate);
      
      const dayOfWeek = dayOfWeekMapping[dayOfWeekNumber] || "Unknown";
      const dateFormatted = format(currentDate, "MM/dd");

      const dayPlaces: ItineraryPlaceWithTime[] = [];
      const placeNamesInOrder = daySummary.interleaved_route
        ? daySummary.interleaved_route.filter((idOrName): idOrName is string => typeof idOrName === 'string' && isNaN(Number(idOrName)))
        : []; // Fallback if interleaved_route is not purely node/link IDs

      placeNamesInOrder.forEach(placeName => {
        const scheduleItem = response.schedule.find(s => s.place_name === placeName);
        const placeDetail = findPlaceByName(placeName);

        if (placeDetail && scheduleItem) {
          const timeInfo = parseTimeBlock(scheduleItem.time_block);
          dayPlaces.push({
            ...placeDetail,
            ...timeInfo,
            // category: toCategoryName(placeDetail.category || scheduleItem.place_type || 'landmark'), // Ensure category is CategoryName
            category: placeDetail.category || scheduleItem.place_type || 'landmark', // Assuming it's already string / CategoryName compatible
            timeBlock: scheduleItem.time_block, // Keep original time_block for display
          });
        } else if (placeDetail) { // Place exists but not in schedule (e.g. start/end points if not in schedule items)
            dayPlaces.push({
                ...placeDetail,
                // category: toCategoryName(placeDetail.category || 'landmark'),
                 category: placeDetail.category || 'landmark',
            });
        }
      });
      
      // Calculate travel times (simplified)
      for (let i = 0; i < dayPlaces.length - 1; i++) {
        if (dayPlaces[i].departTime && dayPlaces[i+1].arriveTime) {
          try {
            const depart = new Date(`1970-01-01T${dayPlaces[i].departTime!}:00`);
            const arrive = new Date(`1970-01-01T${dayPlaces[i+1].arriveTime!}:00`);
            const diffMinutes = Math.round((arrive.getTime() - depart.getTime()) / (1000 * 60));
            if (diffMinutes >= 0) {
              dayPlaces[i].travelTimeToNext = `${diffMinutes}분`;
            }
          } catch (e) { /* ignore date parsing error */ }
        }
      }

      const routeData: RouteData = {
        nodeIds: daySummary.interleaved_route?.filter((id): id is string => typeof id === 'string' && !isNaN(Number(id))).map(String) || [], // Assuming numeric strings are node IDs
        linkIds: daySummary.interleaved_route?.filter((id): id is string => typeof id === 'string' && isNaN(Number(id)) && id.startsWith("LINK_")).map(String) || [], // Simplistic link ID check
        // segmentRoutes: [] // This would require more detailed parsing if needed
      };


      itineraryDays.push({
        day: dayIndex + 1,
        places: dayPlaces,
        totalDistance: daySummary.total_distance_m / 1000, // Convert meters to km
        routeData: routeData,
        interleaved_route: daySummary.interleaved_route,
        dayOfWeek: dayOfWeek,
        date: dateFormatted,
      });
    });

    return itineraryDays.length > 0 ? itineraryDays : null;
  }, [findPlaceByName, startDateTime]);

  return { parseSchedule };
};
