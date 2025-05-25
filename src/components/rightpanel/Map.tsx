import React, { useEffect, useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay } from '@/types/supabase'; // Assuming this is correct, otherwise use types/core
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
    showGeoJson, // This prop is used by MapControls and GeoJsonLayer
    toggleGeoJsonVisibility, // This prop is used by MapControls
    handleGeoJsonLoaded,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    serverRoutesData,
    renderItineraryRoute,
    updateDayPolylinePaths,
  } = useMapContext();

  // 현재 선택된 일자의 itinerary 데이터
  const currentDayItinerary = useMemo(() => {
    if (itinerary && selectedDay !== null) {
      return itinerary.find(day => day.day === selectedDay);
    }
    return null;
  }, [itinerary, selectedDay]);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    isGeoJsonLoaded,
    renderItineraryRoute,
    updateDayPolylinePaths, 
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  // 일정 및 선택된 일자가 변경되면 경로 렌더링
  useEffect(() => {
    if (itinerary && selectedDay !== null && currentDayItinerary && renderItineraryRoute) {
      console.log(`[Map] Selected day ${selectedDay} has ${currentDayItinerary.places?.length || 0} places`);
      if (serverRoutesData && serverRoutesData[selectedDay]) { // Ensure serverRoutesData for the day exists
        renderItineraryRoute(currentDayItinerary, serverRoutesData);
      } else if (!serverRoutesData || !serverRoutesData[selectedDay]) {
        // Fallback or alternative logic if serverRoutesData is not ready for the selected day
        // This might involve rendering a simpler route or just markers
        console.warn(`[Map] serverRoutesData not available for day ${selectedDay}. Route rendering might be incomplete.`);
        // Optionally, you could call renderItineraryRoute with a modified call or handle differently
        // For now, just logging. Depending on requirements, could render markers only, or a direct line.
      }
    }
  }, [itinerary, selectedDay, currentDayItinerary, serverRoutesData, renderItineraryRoute]);

  // MapMarkers에 대한 고유 키 생성 - 의존성 배열 확장
  const markersKey = useMemo(() => {
    const placesId = places.map(p => p.id).join('_') || 'empty';
    
    const itineraryId = itinerary && itinerary.length > 0 && itinerary[0] ? 
      `${itinerary.length}-${itinerary[0].day}-${itinerary[0].date}` : 
      'no-itinerary';
      
    const dayId = selectedDay !== null ? `day-${selectedDay}` : 'no-day';
    const selectedPlaceId = selectedPlace ? `place-${selectedPlace.id}` : 'no-selected';
    const selectedPlacesIds = selectedPlaces.map(p => p.id).join('_') || 'no-selected-places';
    
    return `markers-${dayId}-${itineraryId}-${placesId}-${selectedPlaceId}-${selectedPlacesIds}`;
  }, [places, itinerary, selectedDay, selectedPlace, selectedPlaces]);

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
