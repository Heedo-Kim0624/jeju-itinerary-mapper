import React, { useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
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

  // 현재 선택된 일자의 places만 추출
  const currentDayPlaces = useMemo((): ItineraryPlaceWithTime[] | Place[] => {
    if (currentDayItinerary && currentDayItinerary.places && currentDayItinerary.places.length > 0) {
      return currentDayItinerary.places;
    }
    return places;
  }, [currentDayItinerary, places]);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    renderItineraryRoute,
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {/* 마커와 GeoJSON 레이어 렌더링 제거 */}
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;
