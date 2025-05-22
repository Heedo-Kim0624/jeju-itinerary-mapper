
import { useCallback } from 'react';
import type { ItineraryDay, Place, SelectedPlace, CategoryName, SchedulePayload } from '@/types/core';
import { useItineraryCreator } from '@/hooks/use-itinerary-creator'; // For fallback creation
import { UseTripDetailsReturn } from '@/hooks/use-trip-details'; // Import a more specific type if available
import { UseSelectedPlacesReturn }  from '@/hooks/use-selected-places'; // Import a more specific type if available


interface ItineraryState {
  itinerary: ItineraryDay[];
  selectedItineraryDay: number;
  isItineraryCreated: boolean;
  showItinerary: boolean;
  lastSentPayload: SchedulePayload | null;
}

interface ItinerarySetters {
  setItinerary: React.Dispatch<React.SetStateAction<ItineraryDay[]>>;
  setSelectedItineraryDay: React.Dispatch<React.SetStateAction<number>>;
  setIsItineraryCreated: React.Dispatch<React.SetStateAction<boolean>>;
  setShowItinerary: React.Dispatch<React.SetStateAction<boolean>>;
  setLastSentPayload: React.Dispatch<React.SetStateAction<SchedulePayload | null>>;
}

interface UseItineraryActionsProps extends ItineraryState, ItinerarySetters {
  placesManagement: UseSelectedPlacesReturn; // Use a more specific type
  tripDetails: UseTripDetailsReturn; // Use a more specific type
}


export const useItineraryActions = (props: UseItineraryActionsProps) => {
  const { 
    itinerary, setItinerary, 
    selectedItineraryDay, setSelectedItineraryDay,
    isItineraryCreated, setIsItineraryCreated,
    showItinerary, setShowItinerary,
    lastSentPayload, setLastSentPayload,
    placesManagement, tripDetails
  } = props;

  const { createItineraryFromPlaces } = useItineraryCreator();

  const handleSelectItineraryDay = useCallback((day: number) => {
    setSelectedItineraryDay(day);
    setShowItinerary(true);
  }, [setSelectedItineraryDay, setShowItinerary]);

  const clearItinerary = useCallback(() => {
    setItinerary([]);
    setIsItineraryCreated(false);
    setShowItinerary(false);
    setSelectedItineraryDay(0); 
    setLastSentPayload(null);
    // Optionally clear selected places from placesManagement if desired
    // placesManagement.setSelectedPlaces([]); 
    // placesManagement.setCandidatePlaces([]);
    console.log('[ItineraryActions] Itinerary cleared.');
  }, [setItinerary, setIsItineraryCreated, setShowItinerary, setSelectedItineraryDay, setLastSentPayload]);


  const generateFallbackAndSet = useCallback(() => {
    if (!tripDetails.dates?.startDate || !tripDetails.dates?.endDate || !tripDetails.startTime || !tripDetails.endTime) {
      console.error("Fallback itinerary generation failed: Missing trip details.");
      setItinerary([]);
      setIsItineraryCreated(false);
      return;
    }
    // Use selectedPlaces for fallback if candidatePlaces might not be suitable or defined for this flow.
    const placesForFallback = placesManagement.selectedPlaces.map(p => ({...p, id: String(p.id)} as Place));

    if (placesForFallback.length === 0) {
        console.warn("Fallback itinerary generation: No selected places available.");
        setItinerary([]);
        setIsItineraryCreated(false);
        return;
    }
    
    const fallbackItinerary = createItineraryFromPlaces(
      placesForFallback,
      tripDetails.dates.startDate,
      tripDetails.dates.endDate,
      tripDetails.startTime,
      tripDetails.endTime
    );
    setItinerary(fallbackItinerary || []); // Ensure it's an array
    setIsItineraryCreated(true); // Mark as created even if fallback
    setShowItinerary(true);
  }, [
      createItineraryFromPlaces, 
      placesManagement.selectedPlaces, 
      tripDetails.dates, 
      tripDetails.startTime, 
      tripDetails.endTime, 
      setItinerary, 
      setIsItineraryCreated,
      setShowItinerary
    ]);

  return {
    itinerary,
    selectedItineraryDay,
    isItineraryCreated,
    showItinerary,
    lastSentPayload,
    setLastSentPayload, // Expose for schedule runner
    setItinerary, // Expose for schedule runner
    setIsItineraryCreated, // Expose for schedule runner
    setShowItinerary, // Expose for schedule runner and left panel orchestrator
    handleSelectItineraryDay,
    clearItinerary,
    generateFallbackAndSet,
    setSelectedItineraryDay, // Expose for direct setting
  };
};
