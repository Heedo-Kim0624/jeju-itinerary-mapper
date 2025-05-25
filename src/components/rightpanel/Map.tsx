import React, { useEffect, useRef, useMemo } from 'react';
import { useMapContext } from './MapContext'; // Keep for other context values if needed
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer'; // Keep if still managing raw GeoJSON visibility toggle
import MapControls from './MapControls';   // Keep for map controls (zoom, geojson toggle)

import { useJejuMap } from '@/hooks/use-jeju-map'; // As per guide
import { useDayMarkerRenderer } from '@/hooks/map/useDayMarkerRenderer';
import { useDayRouteRenderer } from '@/hooks/map/useDayRouteRenderer';
import { useGeoJsonData } from '@/hooks/map/useGeoJsonData'; // New GeoJSON data hook
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { useItinerary } from '@/hooks/use-itinerary'; // For itinerary data
import DaySelector from '@/components/common/DaySelector'; // New DaySelector
import { useEventEmitter } from '@/utils/eventEmitter';

import styles from './Map.module.css';
import type { Place } from '@/types/supabase'; // Original Place type for props

// Props for Map component - adjust if necessary
interface MapProps {
  places: Place[]; // General places, might not be directly used if all driven by itinerary
  selectedPlace: Place | null;
  // itinerary and selectedDay are now primarily sourced from hooks
}

const Map: React.FC<MapProps> = ({ 
  // places, // This prop might become redundant if markers are solely from itinerary
  // selectedPlace // This prop might also be handled differently
}) => {
  const { mapContainer: mapContextContainer, isMapError: contextMapError, map: contextMap } = useMapContext(); // Get container from context if preferred
  const mapRefExt = useRef<HTMLDivElement>(null);
  const effectiveMapRef = mapContextContainer || mapRefExt;

  const { mapInstance: naverMap, isNaverLoaded, isMapInitialized : isJejuMapInitialized, isMapError: jejuMapError } = useJejuMap(effectiveMapRef); // Use the map instance from useJejuMap
  
  const { geoJsonLinks, isLoading: isGeoJsonLoading, error: geoJsonError } = useGeoJsonData();
  
  const { itinerary, selectedDay: itinerarySelectedDay, setSelectedDay: setItinerarySelectedDay } = useItinerary(); // Source of truth for itinerary data
  const { setSelectedDay: setStoreSelectedDay, clearAllData: clearRouteMemoryData } = useRouteMemoryStore();
  const storeSelectedDay = useRouteMemoryStore(s => s.selectedDay);

  const { emit } = useEventEmitter();


  // Sync selectedDay from useItinerary to useRouteMemoryStore
  useEffect(() => {
    if (itinerarySelectedDay !== null && itinerarySelectedDay !== storeSelectedDay) {
      // console.log(`[Map.tsx] Syncing itinerarySelectedDay (${itinerarySelectedDay}) to storeSelectedDay.`);
      setStoreSelectedDay(itinerarySelectedDay);
    }
  }, [itinerarySelectedDay, storeSelectedDay, setStoreSelectedDay]);
  
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
    // console.log(`[Map.tsx] DaySelector selected day: ${day}`);
    if (setItinerarySelectedDay) { // useItinerary might not provide setSelectedDay if read-only
       setItinerarySelectedDay(day);
    }
    setStoreSelectedDay(day); // Always update the store
  };

  // Listener for clearing all map elements
  useEffect(() => {
    const handleClearEvent = () => {
      // console.log('[Map.tsx] Received clearAllMapElements event. Clearing markers and polylines.');
      clearAllMarkers();
      clearAllPolylines();
      // Optionally, also clear the route memory store if it's a full reset
      // clearRouteMemoryData(); // Uncomment if a full reset is desired on this event
    };

    const unsubscribe = eventEmitter.on('clearAllMapElements', handleClearEvent);
    return () => unsubscribe();
  }, [clearAllMarkers, clearAllPolylines, eventEmitter, clearRouteMemoryData]);


  // MapContext provided values that might still be relevant:
  const { showGeoJson, toggleGeoJsonVisibility, handleGeoJsonLoaded, isGeoJsonLoaded: contextIsGeoJsonLoaded } = useMapContext();

  // Determine overall loading/error state
  const isLoading = isGeoJsonLoading || !isNaverLoaded || !isJejuMapInitialized;
  const hasError = jejuMapError || geoJsonError || contextMapError;


  // Memoize DaySelector to prevent re-renders if itinerary/selectedDay haven't changed meaningfully
  const daySelectorElement = useMemo(() => {
    if (itinerary && itinerary.length > 0 && itinerarySelectedDay !== null) {
      return (
        <DaySelector
          itinerary={itinerary}
          selectedDay={itinerarySelectedDay}
          onSelectDay={handleDaySelect}
        />
      );
    }
    return null;
  }, [itinerary, itinerarySelectedDay, handleDaySelect]);

  return (
    <div ref={effectiveMapRef} className={styles.mapContainer}>
      {/* Map rendering is handled by useJejuMap hook into the ref */}
      {/* GeoJsonLayer might still be used for raw GeoJSON features if separate from routes */}
      {naverMap && ( // Ensure map instance exists before rendering layers that depend on it
        <GeoJsonLayer 
          map={naverMap} 
          visible={showGeoJson} // From MapContext
          isMapInitialized={isJejuMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={handleGeoJsonLoaded} // From MapContext
        />
      )}
      
      <MapControls
        showGeoJson={showGeoJson} // From MapContext
        onToggleGeoJson={toggleGeoJsonVisibility} // From MapContext
        isMapInitialized={isJejuMapInitialized}
        isGeoJsonLoaded={contextIsGeoJsonLoaded || (geoJsonLinks.length > 0 && !isGeoJsonLoading)} // Combine context and local GeoJSON status
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={!!hasError} // Pass combined error state
      />
      {daySelectorElement}
    </div>
  );
};

export default Map;
