import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
import MapMarkers from './MapMarkers';
import { useItineraryMapContext } from '@/contexts/ItineraryMapContext';
import { useMapDataEffects, UseMapDataEffectsProps } from '@/hooks/map/useMapDataEffects';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

// props 타입 정의 추가
interface MapProps {
  places?: Place[];
  selectedPlace?: Place | null;
  itinerary?: ItineraryDay[] | null;
  selectedDay?: number | null;
  selectedPlaces?: Place[];
}

const Map: React.FC<MapProps> = (props) => {
  // context 사용과 props 사용을 병행
  const contextValues = useItineraryMapContext();
  
  // props가 전달되면 props 우선, 아니면 context 사용
  const selectedDay = props.selectedDay !== undefined ? props.selectedDay : contextValues.selectedDay;
  const currentDayPlaces = props.places || contextValues.currentDayPlaces || [];
  const renderKey = contextValues.renderKey;
  
  const {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
  } = useMapContext();
  
  // useMapDataEffects에 필요한 모든 props 전달
  const mapDataEffectsProps: UseMapDataEffectsProps = {
    isMapInitialized,
    places: currentDayPlaces as ItineraryPlaceWithTime[],
    selectedDay: selectedDay || 0,
    renderItineraryRoute: true,
    serverRoutesData: props.itinerary?.[selectedDay || 0]?.routeData || null,
    checkGeoJsonMapping: true,
    itinerary: props.itinerary || contextValues.itinerary
  };
  
  const { handlePlaceClick } = useMapDataEffects(mapDataEffectsProps);
  
  // 로깅
  useEffect(() => {
    console.log('[Map] 렌더링 - selectedDay:', selectedDay, 'placesCount:', currentDayPlaces?.length || 0, 'renderKey:', renderKey);
  }, [selectedDay, currentDayPlaces, renderKey]);
  
  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {/* key prop으로 강제 리렌더링 보장 */}
      <MapMarkers
        key={`map-markers-${renderKey}-${selectedDay}`}
        places={currentDayPlaces as ItineraryPlaceWithTime[]}
        selectedDay={selectedDay || 0}
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
