
import { useState } from 'react';
import type { ItineraryDay } from '@/types';

export const useItineraryState = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const [isItineraryCreated, setIsItineraryCreated] = useState<boolean>(false);

  const handleSelectItineraryDay = (day: number) => {
    setSelectedItineraryDay(day);
    const selectedDayData = itinerary?.find(d => d.day === day);
    if (selectedDayData) {
      console.log(`[useItineraryState] Selected Day ${day} places:`, selectedDayData.places.map(p => ({name: p.name, x: p.x, y: p.y, id: p.id })));
    }
  };

  return {
    itinerary,
    setItinerary,
    selectedItineraryDay,
    setSelectedItineraryDay,
    showItinerary,
    setShowItinerary,
    isItineraryCreated,
    setIsItineraryCreated,
    handleSelectItineraryDay,
  };
};
