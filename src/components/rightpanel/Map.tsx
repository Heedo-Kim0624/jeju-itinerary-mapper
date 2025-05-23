
import React, { useEffect, useRef, useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay } from '@/types/supabase';
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
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
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    serverRoutesData,
    renderItineraryRoute,
    geoJsonNodes, 
    geoJsonLinks,
  } = useMapContext();

  const {
    itinerary: visualizedItinerary,
    currentDay: visualizedCurrentDay,
    totalDistance: visualizedTotalDistance,
    visualizeDayRoute,
  } = useMapItineraryVisualization(map, geoJsonNodes, geoJsonLinks);

  // 현재 선택된 일자의 itinerary 데이터
  const currentDayData = useMemo(() => {
    if (itinerary && selectedDay !== null) {
      return itinerary.find(day => day.day === selectedDay);
    }
    return null;
  }, [itinerary, selectedDay]);

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

  // 일정 및 선택된 일자가 변경되면 로그 기록
  useEffect(() => {
    if (itinerary && selectedDay !== null && currentDayData) {
      console.log(`[Map] Selected day ${selectedDay} has ${currentDayData.places.length} places`);
    }
  }, [itinerary, selectedDay, currentDayData]);

  // MapMarkers에 대한 고유 키 생성
  const markersKey = useMemo(() => {
    return `markers-${selectedDay}-${itinerary ? itinerary.length : 0}-${places.length}`;
  }, [selectedDay, itinerary, places.length]);

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        key={markersKey}
        places={places}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
        onPlaceClick={handlePlaceClick}
        highlightPlaceId={selectedPlace?.id}
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
