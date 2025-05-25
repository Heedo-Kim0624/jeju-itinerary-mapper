
import React, { useEffect, useRef, useMemo } from 'react';
import { useMapContext } from './MapContext'; 
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer'; 
import MapControls from './MapControls';   

import { useJejuMap } from '@/hooks/use-jeju-map'; 
import { useDayMarkerRenderer } from '@/hooks/map/useDayMarkerRenderer';
import { useDayRouteRenderer } from '@/hooks/map/useDayRouteRenderer';
import { useGeoJsonData } from '@/hooks/map/useGeoJsonData'; 
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { useItinerary } from '@/hooks/use-itinerary'; 
import DaySelector from '@/components/common/DaySelector'; 
import { GlobalEventEmitter, useEventEmitter } from '@/utils/eventEmitter'; // GlobalEventEmitter 추가

import styles from './Map.module.css';
import type { Place, ItineraryDay } from '@/types/supabase'; 

interface MapProps {
  places?: Place[]; // 옵셔널로 변경
  selectedPlace?: Place | null; // 옵셔널로 변경
}

const Map: React.FC<MapProps> = ({ 
  // places, // 더 이상 직접 사용하지 않을 수 있음
  // selectedPlace 
}) => {
  const { mapContainer: mapContextContainer, isMapError: contextMapError } = useMapContext(); 
  const mapRefExt = useRef<HTMLDivElement>(null);
  const effectiveMapRef = mapContextContainer || mapRefExt;

  // useJejuMap에서 mapInstance 대신 map을 사용하고, 인자 전달은 그대로 둡니다.
  const { map: naverMap, isNaverLoaded, isMapInitialized : isJejuMapInitialized, isMapError: jejuMapError } = useJejuMap(effectiveMapRef); 
  
  const { geoJsonLinks, isLoading: isGeoJsonLoading, error: geoJsonError } = useGeoJsonData();
  
  // useItinerary에서 selectedDay -> selectedItineraryDay, setSelectedDay -> setSelectedItineraryDay로 변경
  const { itinerary, selectedItineraryDay, setSelectedItineraryDay } = useItinerary(); 
  const { setSelectedDay: setStoreSelectedDay, clearAllData: clearRouteMemoryData } = useRouteMemoryStore();
  const storeSelectedDay = useRouteMemoryStore(s => s.selectedDay);

  const { emit } = useEventEmitter(); // emit 함수는 useEventEmitter 훅에서 가져옵니다.


  // Sync selectedDay from useItinerary to useRouteMemoryStore
  useEffect(() => {
    if (selectedItineraryDay !== null && selectedItineraryDay !== storeSelectedDay) {
      setStoreSelectedDay(selectedItineraryDay);
    }
  }, [selectedItineraryDay, storeSelectedDay, setStoreSelectedDay]);
  
  const { clearAllMarkers } = useDayMarkerRenderer({
    map: naverMap,
    isNaverLoaded
  });
  
  const { clearAllPolylines } = useDayRouteRenderer({
    map: naverMap,
    isNaverLoaded,
    geoJsonLinks
  });

  const handleDaySelect = (day: number) => {
    if (setSelectedItineraryDay) { 
       setSelectedItineraryDay(day);
    }
    setStoreSelectedDay(day); 
  };

  // Listener for clearing all map elements
  useEffect(() => {
    const handleClearEvent = () => {
      clearAllMarkers();
      clearAllPolylines();
    };

    // GlobalEventEmitter 사용
    const unsubscribe = GlobalEventEmitter.on('clearAllMapElements', handleClearEvent);
    return () => unsubscribe();
  }, [clearAllMarkers, clearAllPolylines, clearRouteMemoryData]);


  const { showGeoJson, toggleGeoJsonVisibility, handleGeoJsonLoaded, isGeoJsonLoaded: contextIsGeoJsonLoaded } = useMapContext();

  const isLoading = isGeoJsonLoading || !isNaverLoaded || !isJejuMapInitialized;
  const hasError = jejuMapError || geoJsonError || contextMapError;


  const daySelectorElement = useMemo(() => {
    if (itinerary && itinerary.length > 0 && selectedItineraryDay !== null) {
      return (
        <DaySelector
          itinerary={itinerary}
          selectedDay={selectedItineraryDay} // 여기는 selectedItineraryDay를 사용
          onSelectDay={handleDaySelect}
        />
      );
    }
    return null;
  }, [itinerary, selectedItineraryDay, handleDaySelect]);

  return (
    <div ref={effectiveMapRef} className={styles.mapContainer}>
      {naverMap && ( 
        <GeoJsonLayer 
          map={naverMap} 
          visible={showGeoJson} 
          isMapInitialized={isJejuMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={handleGeoJsonLoaded} 
        />
      )}
      
      <MapControls
        showGeoJson={showGeoJson} 
        onToggleGeoJson={toggleGeoJsonVisibility} 
        isMapInitialized={isJejuMapInitialized}
        isGeoJsonLoaded={contextIsGeoJsonLoaded || (geoJsonLinks.length > 0 && !isGeoJsonLoading)} 
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={!!hasError} 
      />
      {daySelectorElement}
    </div>
  );
};

export default Map;
