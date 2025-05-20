
import { Place } from '@/types/core';
import { PlaceWithUsedFlag } from '../../utils/schedule';

// Helper function to filter places by category and map them to PlaceWithUsedFlag
const filterAndMapPlaces = (places: Place[], category: string): PlaceWithUsedFlag[] => {
  return places
    .filter(p => p.category === category)
    .map(p => ({ ...p, usedInItinerary: false })); // No cast needed, type is inferred
};

export const categorizePlaces = (places: Place[]): {
  accommodations: PlaceWithUsedFlag[];
  attractions: PlaceWithUsedFlag[];
  restaurants: PlaceWithUsedFlag[];
  cafes: PlaceWithUsedFlag[];
} => {
  const accommodations = filterAndMapPlaces(places, 'accommodation');
  const attractions = filterAndMapPlaces(places, 'attraction');
  const restaurants = filterAndMapPlaces(places, 'restaurant');
  const cafes = filterAndMapPlaces(places, 'cafe');
  
  return { accommodations, attractions, restaurants, cafes };
};

export const calculateDailyQuotas = (
  attractions: PlaceWithUsedFlag[],
  restaurants: PlaceWithUsedFlag[],
  cafes: PlaceWithUsedFlag[],
  numDays: number
): {
  attractionsPerDay: number;
  restaurantsPerDay: number;
  cafesPerDay: number;
} => {
  const attractionsPerDay = Math.ceil(attractions.length / numDays);
  const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
  const cafesPerDay = Math.ceil(cafes.length / numDays);
  
  console.log(`장소 분배: 관광지=${attractionsPerDay}개/일, 식당=${restaurantsPerDay}개/일, 카페=${cafesPerDay}개/일`);
  
  return { attractionsPerDay, restaurantsPerDay, cafesPerDay };
};

