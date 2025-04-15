import React, { useState } from 'react';
import { useMapCore } from './useMapCore';
import { MapProvider } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import { Button } from '@/components/ui/button';
import { LayersIcon } from 'lucide-react';
import type { Place, ItineraryDay } from '@/types/supabase';

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
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    showGeoJson,
    toggleGeoJsonVisibility
  } = useMapCore();

  return (
    <div ref={mapContainer} className="w-full h-full relative">
      <MapProvider value={{
        map,
        isMapInitialized,
        isNaverLoaded,
        isMapError,
        addMarkers,
        calculateRoutes,
        clearMarkersAndUiElements
      }}>
        <MapMarkers
          places={places}
          selectedPlace={selectedPlace}
          itinerary={itinerary}
          selectedDay={selectedDay}
          selectedPlaces={selectedPlaces}
        />
      </MapProvider>
      
      {isMapInitialized && (
        <GeoJsonLayer map={map} visible={showGeoJson} />
      )}
      
      {isNaverLoaded && (
        <div className="absolute bottom-4 right-4 z-10">
          <Button 
            variant="outline" 
            size="sm" 
            className="bg-white" 
            onClick={toggleGeoJsonVisibility}
            title={showGeoJson ? "도로망 숨기기" : "도로망 표시하기"}
          >
            <LayersIcon className="w-4 h-4 mr-1" />
            {showGeoJson ? "도로망 숨기기" : "도로망 표시하기"}
          </Button>
        </div>
      )}
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;
