
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay } from './use-itinerary-creator';

export const useItinerary = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();

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
