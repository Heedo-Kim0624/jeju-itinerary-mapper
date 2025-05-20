
import { Place, ItineraryPlaceWithTime } from '@/types/core';
import { PlaceWithUsedFlag, findNearestPlace } from '../../utils/schedule';
import { format, addMinutes, Duration } from 'date-fns';

interface ScheduleDayActivitiesParams {
  dayNumber: number;
  startTime: Date;
  startPlace: PlaceWithUsedFlag | null;
  availableAttractions: PlaceWithUsedFlag[];
  availableRestaurants: PlaceWithUsedFlag[];
  availableCafes: PlaceWithUsedFlag[];
  quotas: { attractionsPerDay: number; restaurantsPerDay: number; cafesPerDay: number };
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number;
  estimateTravelTime: (distance: number) => number;
  getTimeBlock: (day: number, hour: number) => string;
}

interface ScheduledActivityResult {
  scheduledActivities: ItineraryPlaceWithTime[];
  rawActivities: Place[]; // For distance calculation
  finalTime: Date;
  lastActivityPlace: PlaceWithUsedFlag | null;
}

const createItineraryPlace = (
  place: PlaceWithUsedFlag,
  arriveTime: Date,
  dayNumber: number,
  getTimeBlock: (day: number, hour: number) => string
): ItineraryPlaceWithTime => ({
  ...place,
  arriveTime: format(arriveTime, 'HH:mm'),
  timeBlock: getTimeBlock(dayNumber, arriveTime.getHours()),
  id: place.id,
  name: place.name,
  address: place.address,
  phone: place.phone,
  category: place.category,
  description: place.description,
  rating: place.rating,
  x: place.x,
  y: place.y,
  image_url: place.image_url,
  road_address: place.road_address,
  homepage: place.homepage,
  geoNodeId: place.id, // Assuming geoNodeId is same as id
});

export const scheduleDayActivities = ({
  dayNumber,
  startTime,
  startPlace,
  availableAttractions,
  availableRestaurants,
  availableCafes,
  quotas,
  calculateDistance,
  estimateTravelTime,
  getTimeBlock,
}: ScheduleDayActivitiesParams): ScheduledActivityResult => {
  const scheduledActivities: ItineraryPlaceWithTime[] = [];
  const rawActivities: Place[] = [];
  let currentTime = new Date(startTime);
  let currentPlace: PlaceWithUsedFlag | null = startPlace;

  const distanceBetweenPlacesAdapter = (p1: Place, p2: Place): number => {
    if (p1.y && p1.x && p2.y && p2.x) {
      return calculateDistance(p1.y, p1.x, p2.y, p2.x);
    }
    return Infinity;
  };

  // Add Attractions
  let attractionsAdded = 0;
  for (let i = 0; i < quotas.attractionsPerDay && availableAttractions.some(a => !a.usedInItinerary); i++) {
    let attractionToAdd: PlaceWithUsedFlag | null = null;
    if (!currentPlace && availableAttractions.some(a => !a.usedInItinerary)) {
        attractionToAdd = availableAttractions.find(a => !a.usedInItinerary)!;
    } else if (currentPlace) {
        attractionToAdd = findNearestPlace(currentPlace, availableAttractions.filter(a => !a.usedInItinerary), distanceBetweenPlacesAdapter);
    }

    if (attractionToAdd) {
      attractionToAdd.usedInItinerary = true;
      const distance = (currentPlace?.y && currentPlace?.x && attractionToAdd.y && attractionToAdd.x)
        ? calculateDistance(currentPlace.y, currentPlace.x, attractionToAdd.y, attractionToAdd.x) : 0;
      const travelTime = estimateTravelTime(distance);

      if (scheduledActivities.length > 0 && currentPlace) {
         // If this is not the first activity (i.e. startPlace was an accommodation)
         // or if there was a previous activity scheduled in this function.
        const lastScheduledActivity = scheduledActivities[scheduledActivities.length -1];
        if(lastScheduledActivity) lastScheduledActivity.travelTimeToNext = `${travelTime}분`;
      } else if (currentPlace && scheduledActivities.length === 0 && startPlace === currentPlace) {
        // This handles the case where startPlace (e.g. accommodation) is the first "activity"
        // and we are now adding the *actual* first activity.
        // We need to find a way to add travelTimeToNext to the accommodation,
        // This will be handled by the calling function `assignPlacesToDays`
      }


      if (currentPlace) { // Only add travel time if there's a place to travel from
          currentTime = addMinutes(currentTime, travelTime);
      }
      
      const placeWithTime = createItineraryPlace(attractionToAdd, currentTime, dayNumber, getTimeBlock);
      scheduledActivities.push(placeWithTime);
      rawActivities.push(attractionToAdd);
      currentPlace = attractionToAdd;
      currentTime = addMinutes(currentTime, 60); // 1 hour at attraction
      attractionsAdded++;
    }
  }

  // Add Restaurants
  let restaurantsAdded = 0;
  for (let i = 0; i < quotas.restaurantsPerDay && availableRestaurants.some(r => !r.usedInItinerary); i++) {
    if (!currentPlace) continue;
    const nearestRestaurant = findNearestPlace(currentPlace, availableRestaurants.filter(r => !r.usedInItinerary), distanceBetweenPlacesAdapter);
    if (nearestRestaurant) {
      nearestRestaurant.usedInItinerary = true;
      const distance = (currentPlace.y && currentPlace.x && nearestRestaurant.y && nearestRestaurant.x)
        ? calculateDistance(currentPlace.y, currentPlace.x, nearestRestaurant.y, nearestRestaurant.x) : 0;
      const travelTime = estimateTravelTime(distance);
      if (scheduledActivities.length > 0) scheduledActivities[scheduledActivities.length - 1].travelTimeToNext = `${travelTime}분`;
      
      currentTime = addMinutes(currentTime, travelTime);
      const placeWithTime = createItineraryPlace(nearestRestaurant, currentTime, dayNumber, getTimeBlock);
      scheduledActivities.push(placeWithTime);
      rawActivities.push(nearestRestaurant);
      currentPlace = nearestRestaurant;
      currentTime = addMinutes(currentTime, 90); // 1.5 hours at restaurant
      restaurantsAdded++;
    }
  }

  // Add Cafes
  let cafesAdded = 0;
  for (let i = 0; i < quotas.cafesPerDay && availableCafes.some(c => !c.usedInItinerary); i++) {
    if (!currentPlace) continue;
    const nearestCafe = findNearestPlace(currentPlace, availableCafes.filter(c => !c.usedInItinerary), distanceBetweenPlacesAdapter);
    if (nearestCafe) {
      nearestCafe.usedInItinerary = true;
      const distance = (currentPlace.y && currentPlace.x && nearestCafe.y && nearestCafe.x)
        ? calculateDistance(currentPlace.y, currentPlace.x, nearestCafe.y, nearestCafe.x) : 0;
      const travelTime = estimateTravelTime(distance);
      if (scheduledActivities.length > 0) scheduledActivities[scheduledActivities.length - 1].travelTimeToNext = `${travelTime}분`;

      currentTime = addMinutes(currentTime, travelTime);
      const placeWithTime = createItineraryPlace(nearestCafe, currentTime, dayNumber, getTimeBlock);
      scheduledActivities.push(placeWithTime);
      rawActivities.push(nearestCafe);
      currentPlace = nearestCafe;
      currentTime = addMinutes(currentTime, 60); // 1 hour at cafe
      cafesAdded++;
    }
  }
  
  console.log(`  ${dayNumber}일차 활동: 관광지 ${attractionsAdded}개, 식당 ${restaurantsAdded}개, 카페 ${cafesAdded}개`);

  return { scheduledActivities, rawActivities, finalTime: currentTime, lastActivityPlace: currentPlace };
};
