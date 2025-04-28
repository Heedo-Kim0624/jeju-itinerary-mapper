
import { Place } from '@/types/supabase';
import { PlaceWithUsedFlag, findNearestPlace, categorizeAndFlagPlaces } from '../utils/schedule';
import { calculateDistance, calculateTotalDistance } from '../utils/distance';

export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

export const useItineraryCreator = () => {
  const createItinerary = (
    places: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ): ItineraryDay[] => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    const accommodations = places
      .filter(p => p.category === 'accommodation')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const attractions = places
      .filter(p => p.category === 'attraction')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const restaurants = places
      .filter(p => p.category === 'restaurant')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const cafes = places
      .filter(p => p.category === 'cafe')
      .map(p => ({ ...p, usedInItinerary: false })) as PlaceWithUsedFlag[];
    
    const attractionsPerDay = Math.ceil(attractions.length / numDays);
    const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
    const cafesPerDay = Math.ceil(cafes.length / numDays);
    
    const itinerary: ItineraryDay[] = [];
    
    for (let day = 1; day <= numDays; day++) {
      const dayPlaces: PlaceWithUsedFlag[] = [];
      let currentPlace: PlaceWithUsedFlag | null = null;
      
      // Add accommodation if available
      if (accommodations.length > 0) {
        const accommodation = accommodations.find(a => !a.usedInItinerary);
        if (accommodation) {
          accommodation.usedInItinerary = true;
          dayPlaces.push(accommodation);
          currentPlace = accommodation;
        }
      }
      
      // Start with an attraction if no accommodation
      if (!currentPlace && attractions.length > 0) {
        const attraction = attractions.find(a => !a.usedInItinerary);
        if (attraction) {
          attraction.usedInItinerary = true;
          dayPlaces.push(attraction);
          currentPlace = attraction;
        }
      }
      
      // Fallback to any available place
      if (!currentPlace && places.length > 0) {
        const anyPlace = places.find(p => !p.usedInItinerary);
        if (anyPlace) {
          const placeWithUsedFlag: PlaceWithUsedFlag = { ...anyPlace, usedInItinerary: true };
          dayPlaces.push(placeWithUsedFlag);
          currentPlace = placeWithUsedFlag;
        }
      }
      
      if (currentPlace) {
        // Add attractions
        for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.usedInItinerary); i++) {
          const nearest = findNearestPlace(currentPlace, attractions, calculateDistance);
          if (nearest) {
            nearest.usedInItinerary = true;
            dayPlaces.push(nearest);
            currentPlace = nearest;
          }
        }
        
        // Add restaurants
        for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.usedInItinerary); i++) {
          const nearest = findNearestPlace(currentPlace, restaurants, calculateDistance);
          if (nearest) {
            nearest.usedInItinerary = true;
            dayPlaces.push(nearest);
            currentPlace = nearest;
          }
        }
        
        // Add cafes
        for (let i = 0; i < cafesPerDay && cafes.some(c => !c.usedInItinerary); i++) {
          const nearest = findNearestPlace(currentPlace, cafes, calculateDistance);
          if (nearest) {
            nearest.usedInItinerary = true;
            dayPlaces.push(nearest);
            currentPlace = nearest;
          }
        }
        
        const cleanDayPlaces = dayPlaces.map(({ usedInItinerary, ...rest }) => rest);
        const totalDistance = calculateTotalDistance(cleanDayPlaces);
        
        itinerary.push({
          day,
          places: cleanDayPlaces,
          totalDistance
        });
      }
    }
    
    return itinerary;
  };

  return {
    createItinerary
  };
};
