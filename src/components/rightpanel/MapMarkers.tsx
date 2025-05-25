
import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
import { useMapContext } from './MapContext';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';
// useCustomEventListener import (필요하다면 추가)
// import { useCustomEventListener } from '@/hooks/useEventListeners';


interface MapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places: allPlaces, // Renamed to allPlaces for clarity
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  const loggingPrefix = '[MapMarkers]';
  console.log(`${loggingPrefix} Render. SelectedDay: ${selectedDay}, Highlight: ${highlightPlaceId}`);

  const { 
    map, 
    isMapInitialized, 
    isNaverLoaded,
    handleMarkerRenderingCompleteForContext // Renamed from handleMarkerRenderingComplete
  } = useMapContext();
  
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  const placesToRender = useMemo(() => {
    if (selectedDay !== null && itinerary) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData?.places?.length) {
        console.log(`${loggingPrefix} Day ${selectedDay}: Using ${currentDayData.places.length} places from itinerary.`);
        return currentDayData.places;
      }
      console.log(`${loggingPrefix} Day ${selectedDay}: No places in itinerary, returning empty array.`);
      return []; 
    }
    console.log(`${loggingPrefix} No day selected or no itinerary, using ${allPlaces.length} general places.`);
    return allPlaces;
  }, [allPlaces, itinerary, selectedDay]);
  
  const { renderMarkers } = useMarkerRenderLogic({
    places: placesToRender,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
    markersRef,
    map,
    isMapInitialized,
    isNaverLoaded,
  });

  const clearSelfMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`${loggingPrefix} Clearing ${markersRef.current.length} self-managed markers.`);
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
  }, []);
  
  // Listen for the internal route rendering complete event from MapContext
  useEffect(() => {
    const handleInternalRouteComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ day: number | null; source: string }>;
      // Ensure this event is from MapContext and for the current selected day
      if (customEvent.detail?.source === 'MapContext' && customEvent.detail?.day === selectedDay) {
        console.log(`${loggingPrefix} Event 'routeRenderingCompleteInternal' (day ${customEvent.detail.day}) received. Now rendering markers.`);
        if (isMapInitialized && isNaverLoaded) {
          clearSelfMarkers(); // Clear only markers managed by this component
          renderMarkers(); // This uses placesToRender, which is already filtered for selectedDay
          if (handleMarkerRenderingCompleteForContext) {
             handleMarkerRenderingCompleteForContext(); // Notify context that markers are done for this day
          }
        }
      } else {
         // console.log(`${loggingPrefix} Ignored 'routeRenderingCompleteInternal' for day ${customEvent.detail?.day} (current: ${selectedDay}) or wrong source ${customEvent.detail?.source}`);
      }
    };

    window.addEventListener('routeRenderingCompleteInternal', handleInternalRouteComplete);
    return () => {
      window.removeEventListener('routeRenderingCompleteInternal', handleInternalRouteComplete);
    };
  }, [isMapInitialized, isNaverLoaded, renderMarkers, clearSelfMarkers, handleMarkerRenderingCompleteForContext, selectedDay]);


  // Listen for the signal that a new day's rendering process has started.
  // This is primarily to clear markers if this component is still mounted
  // but a new day selection has initiated a full clear from MapContext.
  // However, MapContext's startDayRendering already calls global clear functions.
  // This explicit clear might be redundant if MapContext's clear is effective.
  useEffect(() => {
    const handleDayRenderingStarted = (event: Event) => {
        const customEvent = event as CustomEvent<{ day: number | null }>;
        console.log(`${loggingPrefix} Event 'dayRenderingStarted' for day ${customEvent.detail.day}. Clearing self markers.`);
        // MapContext has already globally cleared. This component just needs to reset its internal ref.
        markersRef.current = []; 
    };
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted);
    return () => {
        window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted);
    };
  }, []); // No dependencies, just setup/teardown

  // Component unmounting cleanup
  useEffect(() => {
    return () => {
      console.log(`${loggingPrefix} Component unmounting - clearing self markers.`);
      clearSelfMarkers();
    };
  }, [clearSelfMarkers]);

  return null; 
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const loggingPrefix = '[MapMarkers.memo]';

  if (prevProps.selectedDay !== nextProps.selectedDay) {
    console.log(`${loggingPrefix} Re-rendering due to selectedDay change: ${prevProps.selectedDay} -> ${nextProps.selectedDay}`);
    return false;
  }
  if (prevProps.selectedPlace?.id !== nextProps.selectedPlace?.id) {
    console.log(`${loggingPrefix} Re-rendering due to selectedPlace change.`);
    return false;
  }
  if (prevProps.highlightPlaceId !== nextProps.highlightPlaceId) {
    console.log(`${loggingPrefix} Re-rendering due to highlightPlaceId change.`);
    return false;
  }

  // Compare actual places that would be rendered
  const getPlacesForDay = (props: MapMarkersProps) => {
    if (props.selectedDay !== null && props.itinerary) {
      const dayData = props.itinerary.find(d => d.day === props.selectedDay);
      return dayData?.places || [];
    }
    return props.places;
  };

  const prevRenderPlaces = getPlacesForDay(prevProps);
  const nextRenderPlaces = getPlacesForDay(nextProps);

  if (prevRenderPlaces.length !== nextRenderPlaces.length || 
      prevRenderPlaces.some((p, i) => p.id !== nextRenderPlaces[i]?.id)) {
    console.log(`${loggingPrefix} Re-rendering due to derived placesToRender change.`);
    return false;
  }
  
  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) { // Shallow compare for selectedPlaces
    if ((prevProps.selectedPlaces?.length || 0) !== (nextProps.selectedPlaces?.length || 0) ||
        prevProps.selectedPlaces?.some((p, i) => p.id !== nextProps.selectedPlaces?.[i]?.id)) {
      console.log(`${loggingPrefix} Re-rendering due to selectedPlaces content change.`);
      return false;
    }
  }
  
  // console.log(`${loggingPrefix} Skipping re-render.`);
  return true;
});
