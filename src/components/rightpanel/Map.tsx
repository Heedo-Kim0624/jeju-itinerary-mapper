
import React, { useState } from 'react';
import useMapCore from './useMapCore';
import { MapProvider } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
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
  const mapCore = useMapCore();
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
    toggleGeoJsonVisibility,
    panTo
  } = mapCore;

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapProvider value={{
        map,
        isMapInitialized,
        isNaverLoaded,
        isMapError,
        addMarkers,
        calculateRoutes,
        clearMarkersAndUiElements,
        panTo
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
