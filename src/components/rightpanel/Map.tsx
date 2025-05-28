
import React, { useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
import MapMarkers from './MapMarkers'; // Re-enable MapMarkers
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects';

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
    checkGeoJsonMapping,
    renderItineraryRoute,
    serverRoutesData,
    isGeoJsonLoaded,
  } = useMapContext();

  // 현재 선택된 일자의 itinerary 데이터
  const currentDayItinerary = useMemo(() => {
    if (itinerary && selectedDay !== null) {
      return itinerary.find(day => day.day === selectedDay);
    }
    return null;
  }, [itinerary, selectedDay]);

  // 표시할 장소들 결정 - selectedDay에 따라 올바른 장소들을 선택
  const placesToDisplay = useMemo((): ItineraryPlaceWithTime[] | Place[] => {
    console.log('[Map] Computing placesToDisplay:', {
      selectedDay,
      hasItinerary: !!itinerary,
      currentDayItinerary: !!currentDayItinerary,
      currentDayPlacesCount: currentDayItinerary?.places?.length || 0
    });
    
    if (selectedDay !== null && currentDayItinerary && currentDayItinerary.places && currentDayItinerary.places.length > 0) {
      console.log(`[Map] Using day ${selectedDay} places:`, currentDayItinerary.places.map(p => ({ name: p.name, x: p.x, y: p.y })));
      return currentDayItinerary.places;
    }
    
    console.log('[Map] Using general places:', places.map(p => ({ name: p.name, x: p.x, y: p.y })));
    return places;
  }, [selectedDay, currentDayItinerary, places]);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    renderItineraryRoute,
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  console.log('[Map] Rendering with selectedDay:', selectedDay, 'placesToDisplay count:', placesToDisplay.length);

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {/* Render numbered markers for itinerary places */}
      <MapMarkers
        places={placesToDisplay}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
        onPlaceClick={handlePlaceClick}
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;
