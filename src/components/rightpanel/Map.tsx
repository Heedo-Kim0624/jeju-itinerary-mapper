
import React from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay } from '@/types/supabase';
// Removed toast import as it's handled in the new hook
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
import DaySelectorMapOverlay from '@/components/map/DaySelector';
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects'; // Import the new hook

interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const Map: React.FC<MapProps> = ({ 
  places, 
  selectedPlace, 
  itinerary, 
  selectedDay,
  selectedPlaces = [] 
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
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    serverRoutesData,
    renderItineraryRoute,
    // geoJsonNodes and geoJsonLinks are used by useMapItineraryVisualization, not directly here anymore
    geoJsonNodes, 
    geoJsonLinks,
    // clearAllRoutes // This was not used directly in Map.tsx
  } = useMapContext();

  const {
    itinerary: visualizedItinerary,
    currentDay: visualizedCurrentDay,
    totalDistance: visualizedTotalDistance,
    visualizeDayRoute,
  } = useMapItineraryVisualization(map, geoJsonNodes, geoJsonLinks);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    isGeoJsonLoaded,
    showGeoJson,
    toggleGeoJsonVisibility,
    renderItineraryRoute,
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  // All useEffect blocks and handlePlaceClick function have been moved to useMapDataEffects

  const isNewVisualizationActive = visualizedItinerary && visualizedItinerary.length > 0;

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        places={places}
        selectedPlace={selectedPlace}
        itinerary={isNewVisualizationActive ? null : itinerary}
        selectedDay={isNewVisualizationActive ? null : selectedDay}
        selectedPlaces={selectedPlaces}
        onPlaceClick={handlePlaceClick} // Use the handler from the hook
      />
      
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
        isGeoJsonLoaded={isGeoJsonLoaded}
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;
