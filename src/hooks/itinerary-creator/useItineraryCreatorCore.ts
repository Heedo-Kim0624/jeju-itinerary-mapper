
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { estimateTravelTime, getTimeBlock } from './timeUtils'; // Keep existing timeUtils
import { assignPlacesToDays } from './placeAssignmentUtils';
import { calculateDistance } from '../../utils/distance'; // Keep existing calculateDistance

// Helper function to get day of week string and date string
const getDayInfo = (baseDate: Date, dayOffset: number): { dayOfWeek: string, date: string } => {
  const targetDate = new Date(baseDate);
  targetDate.setDate(baseDate.getDate() + dayOffset);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return {
    dayOfWeek: days[targetDate.getDay()],
    date: `${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getDate().toString().padStart(2, '0')}`
  };
};


export const useItineraryCreator = () => {
  const createItinerary = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string, // e.g., "09:00"
    endTime: string    // e.g., "18:00"
  ): ItineraryDay[] => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    console.log(`일정 생성 시작: ${numDays}일간의 여행 (${places.length}개 장소)`);
    
    const [startHour, startMinute] = startTime.split(':').map(Number);

    // assignPlacesToDays now correctly called with two arguments
    const placesPerDayArray: Place[][] = assignPlacesToDays(places, numDays);
    
    // Convert Place[][] to ItineraryDay[]
    const itinerary: ItineraryDay[] = placesPerDayArray.map((dayPlaces, index) => {
      const dayNumber = index + 1;
      const { dayOfWeek, date } = getDayInfo(startDate, index);

      // Transform Place to ItineraryPlaceWithTime
      // This is a simplified transformation. Detailed time calculations would be more complex.
      let currentTime = new Date(startDate);
      currentTime.setHours(startHour, startMinute, 0, 0);
      
      const itineraryPlaces: ItineraryPlaceWithTime[] = dayPlaces.map((place, placeIndex) => {
        const arriveTimeDate = new Date(currentTime);
        // Add travel time from previous place if not the first place
        if (placeIndex > 0) {
            // Simplified: add 30 mins travel time
            arriveTimeDate.setMinutes(arriveTimeDate.getMinutes() + 30);
        }

        const departTimeDate = new Date(arriveTimeDate);
        departTimeDate.setMinutes(departTimeDate.getMinutes() + 60); // Simplified: 1 hour stay

        const formattedArriveTime = `${arriveTimeDate.getHours().toString().padStart(2, '0')}:${arriveTimeDate.getMinutes().toString().padStart(2, '0')}`;
        const formattedDepartTime = `${departTimeDate.getHours().toString().padStart(2, '0')}:${departTimeDate.getMinutes().toString().padStart(2, '0')}`;
        
        currentTime = new Date(departTimeDate); // Update current time for next place

        return {
          ...place, // Spread Place properties
          id: String(place.id), // Ensure ID is string for ItineraryPlaceWithTime if it expects string
          timeBlock: getTimeBlock(dayOfWeek, formattedArriveTime), // Use helper
          arriveTime: formattedArriveTime,
          departTime: formattedDepartTime,
          stayDuration: 60, // minutes
          travelTimeToNext: placeIndex < dayPlaces.length - 1 ? "30분" : "N/A", // Simplified
          // Ensure all required fields for ItineraryPlaceWithTime are present
          // Fallback for potentially missing fields from Place that are required in ItineraryPlaceWithTime
          description: place.description || "No description available",
          rating: place.rating || 0,
          image_url: place.image_url || "",
          homepage: place.homepage || "",
          phone: place.phone || "N/A",
          road_address: place.road_address || place.address,
        };
      });

      return {
        day: dayNumber,
        places: itineraryPlaces,
        totalDistance: 0, // Placeholder, actual calculation needed
        routeData: { // Placeholder
          nodeIds: [],
          linkIds: [],
          segmentRoutes: [],
        },
        interleaved_route: [], // Placeholder
        dayOfWeek: dayOfWeek,
        date: date,
      };
    });
    
    console.log(`일정 생성 완료: ${itinerary.length}일 일정, 총 ${itinerary.reduce((sum, dayItinerary) => sum + dayItinerary.places.length, 0)}개 장소`);
    
    return itinerary;
  };

  return { createItinerary };
};

