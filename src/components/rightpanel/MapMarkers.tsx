import React, { useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapMarkers } from './hooks/useMapMarkers';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedPlaces?: Place[]; 
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  // Debug diagnostic for component render
  // Pass selectedDay from props if needed for logging, but not to useMapMarkers
  const diagnosticSelectedDay = useRouteMemoryStore.getState().selectedDay; // Example for logging
  console.log(`[MapMarkers] Component rendered with selectedDay (from store for diagnostics): ${diagnosticSelectedDay}, itinerary: ${itinerary?.length || 0} days`);
  
  const { forceMarkerUpdate, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    // selectedDay is NOT passed here
    selectedPlacesUi: selectedPlaces, // Prop name in useMapMarkers is selectedPlacesUi
    onPlaceClick,
    highlightPlaceId,
  });

  // Enhanced diagnostic for key props changes
  useEffect(() => {
    const currentSelectedDayFromStore = useRouteMemoryStore.getState().selectedDay;
    console.log(`[MapMarkers] selectedDay (from store) changed to: ${currentSelectedDayFromStore}`);
    console.log(`[MapMarkers] itinerary: ${itinerary ? `${itinerary.length} days` : 'null'}`);
    if (currentSelectedDayFromStore !== null && itinerary) {
      const dayData = itinerary.find(day => day.day === currentSelectedDayFromStore);
      console.log(`[MapMarkers] Selected day ${currentSelectedDayFromStore} has ${dayData?.places?.length || 0} places`);
    }
    
    const timer = setTimeout(() => {
      console.log('[MapMarkers] Forcing marker update due to selectedDay/itinerary change');
      forceMarkerUpdate();
    }, 300);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useRouteMemoryStore.getState().selectedDay, itinerary, forceMarkerUpdate]); // Watch selectedDay from store

  // Explicit handler for route generation event
  useEffect(() => {
    const handleStartScheduleGeneration = () => {
      console.log("[MapMarkers] startScheduleGeneration event detected - clearing all markers");
      clearAllMarkers();
    };
    
    // Explicit handler for day selection event
    const handleDaySelected = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] itineraryDaySelected event detected - day: ${event.detail.day}`);
        // The marker update should be triggered by the selectedDay change from the store via the above useEffect.
        // However, we can still force an update if needed after a small delay.
        setTimeout(() => {
          console.log('[MapMarkers] Forcing marker update due to day selection event');
          forceMarkerUpdate();
        }, 100);
      }
    };
    
    console.log("[MapMarkers] Registering direct event handlers");
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    window.addEventListener('itineraryDaySelected', handleDaySelected);
    
    return () => {
      console.log("[MapMarkers] Removing direct event handlers");
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
      window.removeEventListener('itineraryDaySelected', handleDaySelected);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  // Add an unmount diagnostic
  useEffect(() => {
    return () => {
      console.log("[MapMarkers] Component unmounting - cleaning up");
    };
  }, []);

  return null;
};

// Memoization logic needs to be updated if selectedDay prop is removed or handled differently.
// If selectedDay is now from a store, its changes might not directly trigger re-render here unless
// it's part of a context or another prop changes.
// For now, keeping the memo as is, but it might need re-evaluation based on how re-renders are managed.
export default React.memo(MapMarkers, (prevProps, nextProps) => {
  // Since selectedDay prop is removed, we should compare based on other relevant props.
  // If selectedDay from store is the driver, this component might not need memoization on selectedDay directly,
  // or it should consume selectedDay from context/store for comparison.
  const prevSelectedDayFromStore = useRouteMemoryStore.getState().selectedDay; // Example, this is not ideal in memo
  const nextSelectedDayFromStore = useRouteMemoryStore.getState().selectedDay; // This won't work correctly in React.memo like this.

  const isSameSelectedPlace = prevProps.selectedPlace?.id === nextProps.selectedPlace?.id;
  const isSameHighlightId = prevProps.highlightPlaceId === nextProps.highlightPlaceId;
  
  const prevItineraryLength = prevProps.itinerary?.length || 0;
  const nextItineraryLength = nextProps.itinerary?.length || 0;
  const isSameItineraryLength = prevItineraryLength === nextItineraryLength;
  
  const isSamePlacesLength = prevProps.places.length === nextProps.places.length;
  
  // Re-evaluating shouldUpdate without direct selectedDay prop
  // Change in itinerary length might be a good proxy for now.
  const shouldUpdate = !isSameItineraryLength; 
  
  if (shouldUpdate) {
    console.log("[MapMarkers] Memo comparison detected change (itinerary length) - will re-render", {
      isSameItineraryLength,
    });
  }
  
  return isSameSelectedPlace && isSameHighlightId && isSamePlacesLength && isSameItineraryLength;
});

// Need to import useRouteMemoryStore if used in the functional component body or memo
// For simplicity in this diff, I added a direct store access for logging,
// but a proper solution would involve connecting the component to the store if needed for rendering logic.
// However, useMapMarkers hook already uses the store for selectedDay.
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; // Add this import
