
import React, { useEffect, useRef, useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';

// Removed direct import of useJejuMap as it's handled by context
import { useDayMarkerRenderer } from '@/hooks/map/useDayMarkerRenderer'; // This was in previous user code, assuming it's still needed or will be used.
import { useDayRouteRenderer } from '@/hooks/map/useDayRouteRenderer'; // This was in previous user code
import { useGeoJsonData } from '@/hooks/map/useGeoJsonData';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { useItinerary } from '@/hooks/use-itinerary';
import DaySelector from '@/components/common/DaySelector';
import { GlobalEventEmitter } from '@/utils/eventEmitter'; // useEventEmitter removed as emit was not used directly in Map

import styles from './Map.module.css';
import type { Place, ItineraryDay } from '@/types/supabase'; // ItineraryDay from supabase, core might have its own. Check consistency if issues arise.

interface MapProps {
  // These props are optional as Map might get data from context or hooks
  places?: Place[];
  selectedPlace?: Place | null;
}

const Map: React.FC<MapProps> = ({
  // places, // Not directly used here, managed by specific hooks or context
  // selectedPlace
}) => {
  const {
    map: naverMap, // Use naverMap directly from context
    mapContainer,  // Use mapContainer ref from context
    isNaverLoaded,
    isMapInitialized: isJejuMapInitialized, // isMapInitialized from context
    isMapError: contextMapError, // Renamed to avoid conflict if jejuMapError is defined locally
    showGeoJson,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded: contextHandleGeoJsonLoaded, // Use from context
    isGeoJsonLoaded: contextIsGeoJsonLoaded // Use from context
  } = useMapContext();

  // The direct call to useJejuMap is removed.
  // const { map: naverMap, isNaverLoaded, isMapInitialized : isJejuMapInitialized, isMapError: jejuMapError } = useJejuMap(effectiveMapRef);

  const { geoJsonLinks, isLoading: isGeoJsonLoading, error: geoJsonError } = useGeoJsonData();

  const { itinerary, selectedItineraryDay, setSelectedItineraryDay } = useItinerary();
  const { setSelectedDay: setStoreSelectedDay, clearAllData: clearRouteMemoryData } = useRouteMemoryStore();
  const storeSelectedDay = useRouteMemoryStore(s => s.selectedDay);

  // Sync selectedDay from useItinerary to useRouteMemoryStore
  useEffect(() => {
    if (selectedItineraryDay !== null && selectedItineraryDay !== storeSelectedDay) {
      setStoreSelectedDay(selectedItineraryDay);
    }
  }, [selectedItineraryDay, storeSelectedDay, setStoreSelectedDay]);

  const { clearAllMarkers } = useDayMarkerRenderer({
    map: naverMap, // Pass naverMap from context
    isNaverLoaded // Pass isNaverLoaded from context
  });

  const { clearAllPolylines } = useDayRouteRenderer({
    map: naverMap, // Pass naverMap from context
    isNaverLoaded, // Pass isNaverLoaded from context
    geoJsonLinks // Pass geoJsonLinks from useGeoJsonData
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
      console.log('[Map.tsx] Received clearAllMapElements event. Clearing markers and polylines.');
      clearAllMarkers();
      clearAllPolylines();
      // clearRouteMemoryData(); // Decide if route memory should be cleared here or elsewhere
    };

    const unsubscribe = GlobalEventEmitter.on('clearAllMapElements', handleClearEvent);
    return () => unsubscribe();
  }, [clearAllMarkers, clearAllPolylines]); // clearRouteMemoryData removed if not cleared here

  // isLoading and hasError logic now primarily relies on context and GeoJsonData hook states
  const isLoading = isGeoJsonLoading || !isNaverLoaded || !isJejuMapInitialized;
  const hasError = contextMapError || geoJsonError;


  const daySelectorElement = useMemo(() => {
    if (itinerary && itinerary.length > 0 && selectedItineraryDay !== null) {
      return (
        <DaySelector
          itinerary={itinerary}
          selectedDay={selectedItineraryDay}
          onSelectDay={handleDaySelect}
        />
      );
    }
    return null;
  }, [itinerary, selectedItineraryDay, handleDaySelect]);

  return (
    // Assign the mapContainer ref from context to this div
    <div ref={mapContainer} className={styles.mapContainer}>
      {naverMap && isNaverLoaded && isJejuMapInitialized && (
        <GeoJsonLayer
          map={naverMap}
          visible={showGeoJson}
          isMapInitialized={isJejuMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={contextHandleGeoJsonLoaded} // Use the one from context
        />
      )}

      <MapControls
        showGeoJson={showGeoJson}
        onToggleGeoJson={toggleGeoJsonVisibility}
        isMapInitialized={isJejuMapInitialized}
        // isGeoJsonLoaded prop for MapControls should use contextIsGeoJsonLoaded or a combination
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

