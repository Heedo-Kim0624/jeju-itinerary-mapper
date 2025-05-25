
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
    // updateDayPolylinePaths, // useMapContext에서 가져오는 updateDayPolylinePaths는 useMapDataEffects에 직접 전달하지 않음
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
    // updateDayPolylinePaths, // 이 줄을 제거하여 오류 수정
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  // 일정 및 선택된 일자가 변경되면 경로 렌더링
  useEffect(() => {
    // useMapDataEffects 훅 내부에서 renderItineraryRoute가 호출되므로,
    // 이 useEffect 블록은 중복 로직이 될 수 있습니다.
    // useMapDataEffects 내부의 로직이 의도대로 동작하는지 확인 후, 필요하다면 이 블록을 조정하거나 제거할 수 있습니다.
    // 현재는 useMapDataEffects에 의존하여 경로 렌더링이 관리되므로, 이 블록은 잠재적으로 중복되거나 충돌을 일으킬 수 있습니다.
    // 이전 단계에서 useMapDataEffects가 경로 렌더링을 담당하도록 수정되었으므로, 이 useEffect는 제거하거나
    // 매우 특정한 다른 목적 (예: serverRoutesData가 아직 없을 때의 초기 마커 표시 등)으로 재정의해야 합니다.
    // 지금은 콘솔 로그를 유지하여 흐름을 관찰합니다.
    if (itinerary && selectedDay !== null && currentDayItinerary && renderItineraryRoute) {
      console.log(`[Map Component Effect] Selected day ${selectedDay} has ${currentDayItinerary.places?.length || 0} places. Attempting to render route.`);
      // renderItineraryRoute(currentDayItinerary, serverRoutesData); // 이 호출은 useMapDataEffects에서 이미 처리될 가능성이 높음
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

