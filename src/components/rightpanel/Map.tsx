
import React, { useEffect } from 'react'; // useMemo removed as markersKey not used now
import { useMapContext } from './MapContext';
// MapMarkers component is not directly used if useMapMarkers hook handles everything
import { useMapMarkers } from '@/hooks/map/useMapMarkers'; 
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { ItineraryDay as CoreItineraryDay } from '@/types/core'; // Place from core, ItineraryDay from core
import { GlobalEventEmitter } from '@/hooks/events/useEventEmitter'; // For emitting daySelected
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; 

interface MapProps {
  // places: Place[]; // General places, if needed for non-itinerary markers
  selectedPlace: CoreItineraryDay['places'][0] | null; // More specific type if possible
  itinerary: CoreItineraryDay[] | null; 
  selectedDay: number | null; // Primary selected day from parent (e.g., useItinerary)
  // selectedPlaces?: Place[]; // For general selection, if needed
}

const Map: React.FC<MapProps> = ({ 
  selectedPlace, 
  itinerary, 
  selectedDay, 
}) => {
  const {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    showGeoJson,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded, 
    renderItineraryRoute, 
  } = useMapContext();

  // The useMapMarkers hook now manages markers based on selectedMapDay from the store.
  // It requires the full itinerary.
  useMapMarkers({ 
    map, 
    itinerary, 
    onPlaceClick: (place, index) => {
      console.log('[Map.tsx] Itinerary Marker clicked:', place, 'at index', index);
      // Potentially update selectedPlace state here or open a detail dialog
      // This replaces onPlaceClick from useMapDataEffects for itinerary markers.
    }
  });

  const { selectedMapDay } = useRouteMemoryStore();

  // Synchronize the primary selectedDay (from props) with the map's selected day in the store.
  useEffect(() => {
    if (selectedDay !== null && selectedDay !== selectedMapDay) {
      console.log(`[Map.tsx] Prop 'selectedDay' (${selectedDay}) differs from store 'selectedMapDay' (${selectedMapDay}). Emitting 'daySelected' event.`);
      GlobalEventEmitter.emit('daySelected', { day: selectedDay });
    }
  }, [selectedDay, selectedMapDay]);

  // Route rendering is now mostly driven by useItineraryGeoJsonRenderer (via useRouteManager in context)
  // which listens to selectedMapDay from the store.
  // This effect ensures that if renderItineraryRoute is explicitly called (e.g. after data load),
  // it uses the correct day's data.
  useEffect(() => {
    if (map && isMapInitialized && renderItineraryRoute && itinerary && selectedMapDay !== null) {
      const currentDayItineraryObject = itinerary.find(d => d.day === selectedMapDay);
      if (currentDayItineraryObject) {
        console.log(`[Map.tsx] selectedMapDay is ${selectedMapDay}. Calling renderItineraryRoute from context.`);
        renderItineraryRoute(currentDayItineraryObject, undefined);
      } else {
        // This case means selectedMapDay is set, but no corresponding ItineraryDay object found in the itinerary prop.
        // This could happen if itinerary data is not yet loaded or inconsistent.
        // The route renderer should handle this by attempting fallback or clearing routes.
        console.warn(`[Map.tsx] No ItineraryDay object found for selectedMapDay ${selectedMapDay} in the provided itinerary. Route rendering might be empty or fallback.`);
        // Optionally, explicitly clear or call renderer with null to signify no specific day data
        // renderItineraryRoute(null, undefined); 
      }
    }
  }, [map, isMapInitialized, renderItineraryRoute, itinerary, selectedMapDay]);


  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {map && (
        <GeoJsonLayer 
          map={map} 
          visible={showGeoJson} 
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={handleGeoJsonLoaded} 
        />
      )}
      
      <MapControls
        showGeoJson={showGeoJson}
        onToggleGeoJson={toggleGeoJsonVisibility}
        isMapInitialized={isMapInitialized}
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;

