
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
      placesByCategory[place.category].push(place);
    });
    
    const itinerary: ItineraryDay[] = [];
    
    const calculateDistance = (p1: Place, p2: Place) => {
      const dx = p1.x - p2.x;
      const dy = p1.y - p2.y;
      return Math.sqrt(dx * dx + dy * dy) * 111;
    };
    
    const findNearestPlace = (currentPlace: Place, remainingPlaces: Place[]): Place | null => {
      if (remainingPlaces.length === 0) return null;
      
      let nearestPlace = remainingPlaces[0];
      let minDistance = calculateDistance(currentPlace, nearestPlace);
      
      for (let i = 1; i < remainingPlaces.length; i++) {
        const distance = calculateDistance(currentPlace, remainingPlaces[i]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestPlace = remainingPlaces[i];
        }
      }
      
      return nearestPlace;
    };
    
    const placesPerDay = Math.ceil(places.length / numDays);
    
    for (let day = 1; day <= numDays; day++) {
      const dayPlaces: Place[] = [];
      let totalDistance = 0;
      let remainingPlaces = [...places];
      
      itinerary.forEach(dayItinerary => {
        dayItinerary.places.forEach(place => {
          remainingPlaces = remainingPlaces.filter(p => p.id !== place.id);
        });
      });
      
      if (remainingPlaces.length > 0) {
        let currentPlace = remainingPlaces.find(p => p.category === 'accommodation') || remainingPlaces[0];
        dayPlaces.push(currentPlace);
        remainingPlaces = remainingPlaces.filter(p => p.id !== currentPlace.id);
        
        while (dayPlaces.length < placesPerDay && remainingPlaces.length > 0) {
          const nearest = findNearestPlace(currentPlace, remainingPlaces);
          if (nearest) {
            totalDistance += calculateDistance(currentPlace, nearest);
            currentPlace = nearest;
            dayPlaces.push(currentPlace);
            remainingPlaces = remainingPlaces.filter(p => p.id !== currentPlace.id);
          } else {
            break;
          }
        }
        
        if (dayPlaces.length > 1) {
          totalDistance += calculateDistance(dayPlaces[dayPlaces.length - 1], dayPlaces[0]);
        }
        
        itinerary.push({
          day,
          places: dayPlaces,
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
