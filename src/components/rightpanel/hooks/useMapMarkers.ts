
import { useCallback, useEffect } from 'react';
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
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const {
    places, selectedPlace, itinerary, selectedDay,
    selectedPlaces = [], onPlaceClick, highlightPlaceId,
  } = props;

  const {
    markersRef, prevSelectedDayRef, prevItineraryRef,
    prevPlacesRef, updateRequestIdRef,
  } = useMarkerRefs();

  const { updateTriggerId, forceMarkerUpdate } = useMarkerUpdater({ updateRequestIdRef });

  // Diagnostics log to verify hook execution
  console.log(`[useMapMarkers] Hook execution - selectedDay: ${selectedDay}, triggerId: ${updateTriggerId}, markers count: ${markersRef.current.length}`);

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

  // Add special diagnostic effect to log marker updates
  useEffect(() => {
    console.log(`[useMapMarkers] Update trigger changed: ${updateTriggerId}. Ready to render? ${isMapInitialized}`);
    
    if (updateTriggerId > 0 && isMapInitialized) {
      console.log(`[useMapMarkers] Main hook: Updating markers due to trigger ID change: ${updateTriggerId}`);
      clearAllMarkers(); // Always clear markers before rendering new ones
      renderMarkers();
    }
  }, [updateTriggerId, isMapInitialized, renderMarkers, clearAllMarkers]);
  
  // 초기 마운트 시 강제 렌더링
  useEffect(() => {
    if (isMapInitialized && updateTriggerId === 0) { 
        console.log('[useMapMarkers] Initial mount render logic trigger.');
        forceMarkerUpdate();
    }
  }, [isMapInitialized, map, forceMarkerUpdate, updateTriggerId]);

  // 일정 일자 변경을 위한 명시적 이벤트 리스너
  useEffect(() => {
    const handleItineraryDaySelectedEvent = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[useMapMarkers] itineraryDaySelected 이벤트 감지됨 - 일차: ${event.detail.day}, 타임스탬프: ${event.detail.timestamp || 'unknown'}`);
        // 약간의 지연 후 마커 업데이트 강제 실행 (상태 변경 전파 시간 확보)
        setTimeout(() => {
          clearAllMarkers(); // 기존 마커 명시적 제거
          forceMarkerUpdate(); // 마커 새로 그리기
        }, 50);
      }
    };
    
    window.addEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelectedEvent);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate,
  };
};
