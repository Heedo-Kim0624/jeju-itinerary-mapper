
import { Place, ItineraryPlaceWithTime, ItineraryDay } from '@/types/core'; // ItineraryDay 임포트 경로 수정
import { format, addMinutes } from 'date-fns';
import { PlaceWithUsedFlag } from '../../utils/schedule';
import { calculateTotalDistance } from '../../utils/distance';
// ItineraryDay 임포트를 위에서 이미 했으므로 아래 라인 제거
// import { ItineraryDay } from './useItineraryCreatorCore'; 
import { categorizePlaces, calculateDailyQuotas } from './placeCategorizer';
import { scheduleDayActivities } from './dayActivityScheduler';

interface AssignPlacesToDaysParams {
  places: Place[];
  numDays: number;
  startDate: Date;
  startHour: number;
  startMinute: number;
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  estimateTravelTime: (distance: number) => number;
  getTimeBlock: (day: number, hour: number) => string;
}

const createAccommodationItineraryPlace = (
  accommodation: PlaceWithUsedFlag,
  arriveTime: Date,
  dayNumber: number,
  getTimeBlock: (day: number, hour: number) => string
): ItineraryPlaceWithTime => ({
  ...accommodation,
  arriveTime: format(arriveTime, 'HH:mm'),
  timeBlock: getTimeBlock(dayNumber, arriveTime.getHours()),
  id: accommodation.id,
  name: accommodation.name,
  address: accommodation.address,
  phone: accommodation.phone,
  category: accommodation.category,
  description: accommodation.description,
  rating: accommodation.rating,
  x: accommodation.x,
  y: accommodation.y,
  image_url: accommodation.image_url,
  road_address: accommodation.road_address,
  homepage: accommodation.homepage,
  geoNodeId: accommodation.id,
});

export const assignPlacesToDays = ({
  places,
  numDays,
  startDate,
  startHour,
  startMinute,
  calculateDistance,
  estimateTravelTime,
  getTimeBlock
}: AssignPlacesToDaysParams): ItineraryDay[] => {
  const { accommodations, attractions, restaurants, cafes } = categorizePlaces(places);
  const quotas = calculateDailyQuotas(attractions, restaurants, cafes, numDays);

  const itinerary: ItineraryDay[] = [];

  for (let day = 1; day <= numDays; day++) {
    const dayPlacesWithTime: ItineraryPlaceWithTime[] = [];
    const dayPlacesRaw: Place[] = []; // For total distance calculation

    let currentDayDate = new Date(startDate);
    currentDayDate.setDate(startDate.getDate() + day - 1);
    
    let currentTimeForActivities = new Date(currentDayDate);
    currentTimeForActivities.setHours(startHour, startMinute, 0, 0);
    
    let currentPlaceForDayStart: PlaceWithUsedFlag | null = null;

    // Add accommodation if it's the first day and accommodations are available
    if (day === 1 && accommodations.length > 0) {
      const accommodation = accommodations.find(a => !a.usedInItinerary);
      if (accommodation) {
        accommodation.usedInItinerary = true;
        
        const accommodationItineraryPlace = createAccommodationItineraryPlace(
          accommodation, 
          currentTimeForActivities, 
          day, 
          getTimeBlock
        );
        dayPlacesWithTime.push(accommodationItineraryPlace);
        dayPlacesRaw.push(accommodation);
        currentPlaceForDayStart = accommodation;
        
        // Assume 30 minutes at accommodation before starting activities
        currentTimeForActivities = addMinutes(currentTimeForActivities, 30); 
      }
    }

    const activityResult = scheduleDayActivities({
      dayNumber: day,
      startTime: currentTimeForActivities,
      startPlace: currentPlaceForDayStart,
      availableAttractions: attractions,
      availableRestaurants: restaurants,
      availableCafes: cafes,
      quotas,
      calculateDistance,
      estimateTravelTime,
      getTimeBlock,
    });
    
    // If accommodation was added, and there are activities, link travel time
    if (dayPlacesWithTime.length > 0 && activityResult.scheduledActivities.length > 0 && currentPlaceForDayStart) {
        const accommodationPlace = dayPlacesWithTime[0];
        const firstActivity = activityResult.rawActivities[0];
        if (accommodationPlace && firstActivity && firstActivity.y && firstActivity.x && currentPlaceForDayStart.y && currentPlaceForDayStart.x) {
            const distanceToFirstActivity = calculateDistance(currentPlaceForDayStart.y, currentPlaceForDayStart.x, firstActivity.y, firstActivity.x);
            const travelTimeToFirstActivity = estimateTravelTime(distanceToFirstActivity);
            accommodationPlace.travelTimeToNext = `${travelTimeToFirstActivity}분`;
        }
    }

    dayPlacesWithTime.push(...activityResult.scheduledActivities);
    dayPlacesRaw.push(...activityResult.rawActivities);

    if (dayPlacesWithTime.length > 0) {
      dayPlacesWithTime[dayPlacesWithTime.length - 1].travelTimeToNext = "-";
    }

    const totalDistanceForDay = calculateTotalDistance(dayPlacesRaw);
    
    const scheduledPlacesCount = dayPlacesWithTime.length - (currentPlaceForDayStart ? 1 : 0);
    console.log(`${day}일차 일정: 총 ${dayPlacesWithTime.length}개 장소 (숙소 포함), 활동 ${scheduledPlacesCount}개, 총 거리 ${totalDistanceForDay.toFixed(2)}km`);

    // ItineraryDay 타입에 맞게 dayOfWeek와 date 추가
    const dayOfWeekMap = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayOfWeek = dayOfWeekMap[currentDayDate.getDay()];
    const dateStr = `${(currentDayDate.getMonth() + 1).toString().padStart(2, '0')}/${currentDayDate.getDate().toString().padStart(2, '0')}`;


    itinerary.push({
      day,
      places: dayPlacesWithTime,
      totalDistance: totalDistanceForDay,
      // ItineraryDay 타입에 필요한 나머지 필드 추가 (기본값 또는 계산된 값)
      routeData: { nodeIds: [], linkIds: [], segmentRoutes: [] }, // 기본값
      interleaved_route: [], // 기본값
      dayOfWeek: dayOfWeek, 
      date: dateStr, 
    });
  }

  return itinerary;
};

