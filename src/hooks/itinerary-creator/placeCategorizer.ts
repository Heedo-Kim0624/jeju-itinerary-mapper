
import { Place } from '@/types/core';
import { PlaceWithUsedFlag } from '../../utils/schedule';

export const categorizePlaces = (places: Place[]): {
  accommodations: PlaceWithUsedFlag[];
  attractions: PlaceWithUsedFlag[];
  restaurants: PlaceWithUsedFlag[];
  cafes: PlaceWithUsedFlag[];
} => {
  const accommodations = places
    .filter(p => p.category === 'accommodation')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag));
  const attractions = places
    .filter(p => p.category === 'attraction')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag));
  const restaurants = places
    .filter(p => p.category === 'restaurant')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag));
  const cafes = places
    .filter(p => p.category === 'cafe')
    .map(p => ({ ...p, usedInItinerary: false } as PlaceWithUsedFlag));
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
