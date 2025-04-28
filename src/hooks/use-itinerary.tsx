import { useState } from 'react';
import { Place } from '@/types/supabase';

export interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  
  const createItinerary = (
    places: Place[], 
    startDate: Date, 
    endDate: Date, 
    startTime: string, 
    endTime: string
  ): ItineraryDay[] => {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const numDays = Math.max(1, daysDiff);
    
    const scheduleTable = createEmptyScheduleTable(startDate, startTime, endDate, endTime);
    
    const placesByCategory: Record<string, Place[]> = {};
    places.forEach(place => {
      if (!placesByCategory[place.category]) {
        placesByCategory[place.category] = [];
      }
      placesByCategory[place.category].push({ ...place, used: false });
    });
    
    const itinerary: ItineraryDay[] = [];
    
    const calculateDistance = (p1: Place, p2: Place) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy) * 111;
    };
    
    const findNearestPlace = (currentPlace: Place, remainingPlaces: Place[]): Place | null => {
      if (remainingPlaces.length === 0) return null;
      
      // Filter out places that are already used
      const availablePlaces = remainingPlaces.filter(p => !p.used);
      if (availablePlaces.length === 0) return null;
      
      let nearestPlace = availablePlaces[0];
      let minDistance = calculateDistance(currentPlace, nearestPlace);
      
      for (let i = 1; i < availablePlaces.length; i++) {
        const distance = calculateDistance(currentPlace, availablePlaces[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPlace = availablePlaces[i];
        }
      }
      
      return nearestPlace;
    };
    
    // Handle accommodations separately - prioritize them first
    const accommodations = places.filter(p => p.category === 'accommodation').map(p => ({ ...p, used: false }));
    
    // Other categories
    const attractions = places.filter(p => p.category === 'attraction').map(p => ({ ...p, used: false }));
    const restaurants = places.filter(p => p.category === 'restaurant').map(p => ({ ...p, used: false }));
    const cafes = places.filter(p => p.category === 'cafe').map(p => ({ ...p, used: false }));
    
    // Calculate places per day
    const attractionsPerDay = Math.ceil(attractions.length / numDays);
    const restaurantsPerDay = Math.ceil(restaurants.length / numDays);
    const cafesPerDay = Math.ceil(cafes.length / numDays);
    
    for (let day = 1; day <= numDays; day++) {
      const dayPlaces: Place[] = [];
      let totalDistance = 0;
      
      // Start with accommodation if available
      let currentPlace: Place | null = null;
      if (accommodations.length > 0) {
        const accommodation = accommodations.find(a => !a.used);
        if (accommodation) {
          accommodation.used = true;
          dayPlaces.push(accommodation);
          currentPlace = accommodation;
        }
      }
      
      // If no accommodation, start with an attraction
      if (!currentPlace && attractions.length > 0) {
        const attraction = attractions.find(a => !a.used);
        if (attraction) {
          attraction.used = true;
          dayPlaces.push(attraction);
          currentPlace = attraction;
        }
      }
      
      // If still no starting point, use any available place
      if (!currentPlace && places.length > 0) {
        const anyPlace = places.find(p => !p.used);
        if (anyPlace) {
          anyPlace.used = true;
          dayPlaces.push(anyPlace);
          currentPlace = anyPlace;
        }
      }
      
      if (currentPlace) {
        // Add attractions for the day
        for (let i = 0; i < attractionsPerDay && attractions.some(a => !a.used); i++) {
          const nearest = findNearestPlace(currentPlace, attractions);
          if (nearest) {
            totalDistance += calculateDistance(currentPlace, nearest);
            currentPlace = nearest;
            nearest.used = true;
            dayPlaces.push(nearest);
          }
        }
        
        // Add restaurants for the day
        for (let i = 0; i < restaurantsPerDay && restaurants.some(r => !r.used); i++) {
          const nearest = findNearestPlace(currentPlace, restaurants);
          if (nearest) {
            totalDistance += calculateDistance(currentPlace, nearest);
            currentPlace = nearest;
            nearest.used = true;
            dayPlaces.push(nearest);
          }
        }
        
        // Add cafes for the day
        for (let i = 0; i < cafesPerDay && cafes.some(c => !c.used); i++) {
          const nearest = findNearestPlace(currentPlace, cafes);
          if (nearest) {
            totalDistance += calculateDistance(currentPlace, nearest);
            currentPlace = nearest;
            nearest.used = true;
            dayPlaces.push(nearest);
          }
        }
        
        // Calculate distance back to starting point if needed
        if (dayPlaces.length > 1) {
          totalDistance += calculateDistance(dayPlaces[dayPlaces.length - 1], dayPlaces[0]);
        }
        
        // Remove the temporary 'used' property before adding to itinerary
        const cleanDayPlaces = dayPlaces.map(({ used, ...rest }) => rest);
        
        itinerary.push({
          day,
          places: cleanDayPlaces,
          totalDistance
        });
      }
    }
    
    return itinerary;
  };
  
  const createEmptyScheduleTable = (startDate: Date, startTime: string, endDate: Date, endTime: string) => {
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    const hours = Array.from({ length: 13 }, (_, i) => i + 9);
    const table: Record<string, Place | null> = {};

    const startDay = days[startDate.getDay()];
    const endDay = days[endDate.getDay()];
    const [startHour] = startTime.split(':').map(Number);
    const [endHour] = endTime.split(':').map(Number);
    
    days.forEach(day => {
      hours.forEach(hour => {
        const key = `${day}_${hour}시`;
        table[key] = null;
      });
    });
    
    return table;
  };

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
  };

  const generateItinerary = (
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => {
    const generatedItinerary = createItinerary(
      placesToUse,
      startDate,
      endDate,
      startTime,
      endTime
    );
    
    setItinerary(generatedItinerary);
    setSelectedItineraryDay(1);
    setShowItinerary(true);
    
    return generatedItinerary;
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    generateItinerary
  };
};
