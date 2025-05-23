import React, { useEffect, useRef } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay } from '@/types/supabase';
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects';
// ServerRouteDataForDay는 useServerRoutes에서 export 했으므로 여기선 직접 필요 없음

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
    serverRoutesData, // MapContext에서 Record<number, ServerRouteResponse> 타입으로 제공
    renderItineraryRoute, // MapContext에서 (ItineraryDay | null, ...) 타입으로 제공
    geoJsonNodes, 
    geoJsonLinks,
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
    renderItineraryRoute, // 컨텍스트의 함수를 그대로 전달
    serverRoutesData: serverRoutesData, // 컨텍스트의 데이터를 그대로 전달 (타입 불일치 가능성 있음, useMapDataEffects에서 미사용으로 회피)
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  const lastSelectedDayRef = useRef<number | null>(null);
  const markersKeyRef = useRef<number>(0);

  useEffect(() => {
    if (selectedDay !== lastSelectedDayRef.current) {
      console.log(`[Map] 선택된 일차가 변경되었습니다: ${lastSelectedDayRef.current} -> ${selectedDay}`);
      lastSelectedDayRef.current = selectedDay;
      markersKeyRef.current += 1;
    }
  }, [selectedDay]);

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        key={`markers-${markersKeyRef.current}-${selectedDay}`} // selectedDay를 key에 추가하여 강제 리렌더링 유도
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
