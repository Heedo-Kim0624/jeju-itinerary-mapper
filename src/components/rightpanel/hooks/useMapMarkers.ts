import { useCallback, useEffect, useRef } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

import { useMarkerRefs } from './marker-utils/useMarkerRefs';
import { useMarkerUpdater } from './marker-utils/useMarkerUpdater';
import { useMarkerEventListeners } from './marker-utils/useMarkerEventListeners';
import { useMarkerRenderLogic } from './marker-utils/useMarkerRenderLogic';
import { useMarkerLifecycleManager } from './marker-utils/useMarkerLifecycleManager';

interface UseMapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = (props: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded, currentRenderingDay } = useMapContext();
  const {
    places, selectedPlace, itinerary, selectedDay,
    selectedPlaces = [], onPlaceClick, highlightPlaceId,
  } = props;

  const {
    markersRef, prevSelectedDayRef, prevItineraryRef,
    prevPlacesRef, updateRequestIdRef,
  } = useMarkerRefs();

  const { updateTriggerId, forceMarkerUpdate } = useMarkerUpdater({ updateRequestIdRef });

  console.log(`[useMapMarkers] Hook execution - selectedDay: ${selectedDay}, currentRenderingDay: ${currentRenderingDay}, triggerId: ${updateTriggerId}, markers count: ${markersRef.current.length}`);

  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`[useMapMarkers] Clearing all existing markers: ${markersRef.current.length}`);
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
  }, [markersRef]);

  useMarkerEventListeners({
    clearAllMarkers,
    forceMarkerUpdate,
    prevSelectedDayRef,
  });

  const { renderMarkers } = useMarkerRenderLogic({
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay,
    selectedPlaces,
    onPlaceClick, 
    highlightPlaceId,
    map, 
    isMapInitialized,
    isNaverLoaded: !!window.naver?.maps,
    markersRef,
  });

  useMarkerLifecycleManager({
    selectedDay, 
    itinerary, 
    places, 
    isMapInitialized, 
    map,
    forceMarkerUpdate,
    prevSelectedDayRef, 
    prevItineraryRef, 
    prevPlacesRef,
  });

  // Main effect to handle marker updates - simplified and more direct
  useEffect(() => {
    if (isMapInitialized && map && window.naver?.maps) {
      console.log(`[useMapMarkers] Triggering marker render for day ${selectedDay}`);
      
      // 기존 마커 모두 제거
      clearAllMarkers();
      
      // 약간의 지연 후 마커 렌더링 실행
      const timeoutId = setTimeout(() => {
        renderMarkers();
        console.log(`[useMapMarkers] Rendered markers for day ${selectedDay} after clearing`);
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDay, isMapInitialized, map, renderMarkers, clearAllMarkers]);

  // Handle day selection events from the schedule viewer
  useEffect(() => {
    const handleItineraryDaySelectedEvent = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[useMapMarkers] Day selection event received - Day: ${event.detail.day}`);
        // Clear and re-render markers immediately
        clearAllMarkers();
        setTimeout(() => {
          renderMarkers();
          console.log(`[useMapMarkers] Re-rendered markers after day selection event for day ${event.detail.day}`);
        }, 100);
      }
    };
    
    window.addEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    };
  }, [clearAllMarkers, renderMarkers]);
  
  // 새로 추가: dayRenderingStarted 이벤트 리스너
  useEffect(() => {
    const handleDayRenderingStarted = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[useMapMarkers] dayRenderingStarted event received - Day: ${event.detail.day}`);
        // 기존 마커 모두 제거
        clearAllMarkers();
        
        // 약간의 지연 후 마커 렌더링 실행
        setTimeout(() => {
          renderMarkers();
          console.log(`[useMapMarkers] Re-rendered markers after dayRenderingStarted event for day ${event.detail.day}`);
          
          // 마커 렌더링 완료 이벤트 발생
          window.dispatchEvent(new CustomEvent('markerRenderingComplete', { 
            detail: { day: event.detail.day } 
          }));
        }, 100);
      }
    };
    
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted);
    
    return () => {
      window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted);
    };
  }, [clearAllMarkers, renderMarkers]);

  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate,
  };
};
