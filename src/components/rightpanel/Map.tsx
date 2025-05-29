import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
import MapMarkers from './MapMarkers';
import { useItineraryMapContext } from '@/contexts/ItineraryMapContext';
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects';

const Map: React.FC = () => {
  const { selectedDay, currentDayPlaces, renderKey } = useItineraryMapContext();
  const {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
  } = useMapContext();
  
  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    places: currentDayPlaces || [],
    selectedDay,
  });
  
  // 로깅
  useEffect(() => {
    console.log('[Map] 렌더링 - selectedDay:', selectedDay, 'placesCount:', currentDayPlaces?.length || 0, 'renderKey:', renderKey);
  }, [selectedDay, currentDayPlaces, renderKey]);
  
  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {/* key prop으로 강제 리렌더링 보장 */}
      <MapMarkers
        key={`map-markers-${renderKey}-${selectedDay}`}
        places={currentDayPlaces || []}
        selectedDay={selectedDay}
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
