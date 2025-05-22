
import { Place, ItineraryPlaceWithTime } from '@/types/core';
import { PlaceWithUsedFlag, findNearestPlace } from '../../utils/schedule';
import { format, addMinutes } from 'date-fns';

// Types
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

// Helper functions
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

const calculateTravelTime = (
  fromPlace: PlaceWithUsedFlag | null,
  toPlace: PlaceWithUsedFlag,
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number,
  estimateTravelTime: (distance: number) => number,
): number => {
  if (!fromPlace || !fromPlace.y || !fromPlace.x || !toPlace.y || !toPlace.x) {
    return 0;
  }
  
  const distance = calculateDistance(fromPlace.y, fromPlace.x, toPlace.y, toPlace.x);
  return estimateTravelTime(distance);
};

const addPlaceToSchedule = (
  currentPlace: PlaceWithUsedFlag | null,
  placeToAdd: PlaceWithUsedFlag,
  currentTime: Date,
  dayNumber: number,
  scheduledActivities: ItineraryPlaceWithTime[],
  rawActivities: Place[],
  calculateDistance: (lat1: number, lng1: number, lat2: number, lng2: number) => number,
  estimateTravelTime: (distance: number) => number,
  getTimeBlock: (day: number, hour: number) => string,
): {
  updatedCurrentTime: Date;
  updatedCurrentPlace: PlaceWithUsedFlag;
} => {
  // Mark place as used
  placeToAdd.usedInItinerary = true;
  
  // Calculate travel time
  const travelTime = calculateTravelTime(
    currentPlace,
    placeToAdd,
    calculateDistance,
    estimateTravelTime
  );
  
  // Update previous activity with travel time info
  if (scheduledActivities.length > 0 && currentPlace) {
    const lastScheduledActivity = scheduledActivities[scheduledActivities.length - 1];
    if (lastScheduledActivity) {
      lastScheduledActivity.travelTimeToNext = `${travelTime}분`;
    }
  }
  
  // Add travel time to current time if we're coming from somewhere
  let updatedTime = currentTime;
  if (currentPlace) {
    updatedTime = addMinutes(updatedTime, travelTime);
  }
  
  // Create and add place to schedule
  const placeWithTime = createItineraryPlace(placeToAdd, updatedTime, dayNumber, getTimeBlock);
  scheduledActivities.push(placeWithTime);
  rawActivities.push(placeToAdd);
  
  return {
    updatedCurrentTime: updatedTime,
    updatedCurrentPlace: placeToAdd
  };
};

// Duration constants (in minutes)
const DURATION = {
  ATTRACTION: 60,   // 1 hour at attraction
  RESTAURANT: 90,   // 1.5 hours at restaurant
  CAFE: 60          // 1 hour at cafe
};

// Main function
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

  // Schedule attractions
  let attractionsAdded = 0;
  for (let i = 0; i < quotas.attractionsPerDay && availableAttractions.some(a => !a.usedInItinerary); i++) {
    let attractionToAdd: PlaceWithUsedFlag | null = null;
    
    // Find the next attraction to add
    if (!currentPlace && availableAttractions.some(a => !a.usedInItinerary)) {
      attractionToAdd = availableAttractions.find(a => !a.usedInItinerary)!;
    } else if (currentPlace) {
      attractionToAdd = findNearestPlace(
        currentPlace, 
        availableAttractions.filter(a => !a.usedInItinerary), 
        distanceBetweenPlacesAdapter
      );
    }

    if (attractionToAdd) {
      const result = addPlaceToSchedule(
        currentPlace,
        attractionToAdd,
        currentTime,
        dayNumber,
        scheduledActivities,
        rawActivities,
        calculateDistance,
        estimateTravelTime,
        getTimeBlock
      );
      
      currentTime = result.updatedCurrentTime;
      currentPlace = result.updatedCurrentPlace;
      
      // Add stay duration
      currentTime = addMinutes(currentTime, DURATION.ATTRACTION);
      attractionsAdded++;
    }
  }

  // Schedule restaurants
  let restaurantsAdded = 0;
  for (let i = 0; i < quotas.restaurantsPerDay && availableRestaurants.some(r => !r.usedInItinerary); i++) {
    if (!currentPlace) continue;
    
    const nearestRestaurant = findNearestPlace(
      currentPlace, 
      availableRestaurants.filter(r => !r.usedInItinerary), 
      distanceBetweenPlacesAdapter
    );
    
    if (nearestRestaurant) {
      const result = addPlaceToSchedule(
        currentPlace,
        nearestRestaurant,
        currentTime,
        dayNumber,
        scheduledActivities,
        rawActivities,
        calculateDistance,
        estimateTravelTime,
        getTimeBlock
      );
      
      currentTime = result.updatedCurrentTime;
      currentPlace = result.updatedCurrentPlace;
      
      // Add stay duration
      currentTime = addMinutes(currentTime, DURATION.RESTAURANT);
      restaurantsAdded++;
    }
  }

  // Schedule cafes
  let cafesAdded = 0;
  for (let i = 0; i < quotas.cafesPerDay && availableCafes.some(c => !c.usedInItinerary); i++) {
    if (!currentPlace) continue;
    
    const nearestCafe = findNearestPlace(
      currentPlace, 
      availableCafes.filter(c => !c.usedInItinerary), 
      distanceBetweenPlacesAdapter
    );
    
    if (nearestCafe) {
      const result = addPlaceToSchedule(
        currentPlace,
        nearestCafe,
        currentTime,
        dayNumber,
        scheduledActivities,
        rawActivities,
        calculateDistance,
        estimateTravelTime,
        getTimeBlock
      );
      
      currentTime = result.updatedCurrentTime;
      currentPlace = result.updatedCurrentPlace;
      
      // Add stay duration
      currentTime = addMinutes(currentTime, DURATION.CAFE);
      cafesAdded++;
    }
  }
  
  console.log(`  ${dayNumber}일차 활동: 관광지 ${attractionsAdded}개, 식당 ${restaurantsAdded}개, 카페 ${cafesAdded}개`);

  return { 
    scheduledActivities, 
    rawActivities, 
    finalTime: currentTime, 
    lastActivityPlace: currentPlace 
  };
};
