import { useCallback, useEffect, useRef, useState } from 'react';
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

  // 마커 렌더링 강제 트리거를 위한 상태
  const [renderTrigger, setRenderTrigger] = useState<number>(0);

  const {
    markersRef, prevSelectedDayRef, prevItineraryRef,
    prevPlacesRef, updateRequestIdRef,
  } = useMarkerRefs();

  const { updateTriggerId, forceMarkerUpdate } = useMarkerUpdater({ updateRequestIdRef });

  // 디버깅을 위한 로깅 강화
  console.log(`[useMapMarkers] Hook 실행 - selectedDay: ${selectedDay}, currentRenderingDay: ${currentRenderingDay}, triggerId: ${updateTriggerId}, renderTrigger: ${renderTrigger}, markers 개수: ${markersRef.current.length}`);
  
  // places 데이터 로깅
  useEffect(() => {
    if (places && places.length > 0) {
      console.log(`[useMapMarkers] places 데이터 변경 감지:`, {
        count: places.length,
        firstPlace: places[0] ? { id: places[0].id, name: places[0].name } : null,
        lastPlace: places.length > 1 ? { id: places[places.length-1].id, name: places[places.length-1].name } : null
      });
      
      // places 변경 시 마커 렌더링 강제 트리거
      setRenderTrigger(prev => prev + 1);
    }
  }, [places]);

  // 일자 변경 감지 및 마커 렌더링 강제 트리거
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current) {
      console.log(`[useMapMarkers] 일자 변경 감지: ${prevSelectedDayRef.current} → ${selectedDay}, 마커 렌더링 강제 트리거`);
      
      // 마커 렌더링 강제 트리거
      setRenderTrigger(prev => prev + 1);
      
      // 현재 일자 저장
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay]);

  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`[useMapMarkers] 기존 마커 모두 제거: ${markersRef.current.length}개`);
      
      // 각 마커에 대해 명시적으로 setMap(null) 호출
      markersRef.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(null);
        }
      });
      
      // 마커 배열 비우기
      markersRef.current = [];
      
      // 마커 렌더링 강제 트리거
      setRenderTrigger(prev => prev + 1);
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
      console.log(`[useMapMarkers] 마커 렌더링 트리거 - renderTrigger: ${renderTrigger}, selectedDay: ${selectedDay}`);
      
      // 기존 마커 모두 제거
      clearAllMarkers();
      
      // 약간의 지연 후 마커 렌더링 실행
      const timeoutId = setTimeout(() => {
        renderMarkers();
        console.log(`[useMapMarkers] 일자 ${selectedDay}의 마커 렌더링 완료 - renderTrigger: ${renderTrigger}`);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDay, isMapInitialized, map, renderMarkers, clearAllMarkers, renderTrigger]);

  // Handle day selection events from the schedule viewer
  useEffect(() => {
    const handleItineraryDaySelectedEvent = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[useMapMarkers] 일자 선택 이벤트 수신 - 일자: ${event.detail.day}, 타임스탬프: ${event.detail.timestamp || 'N/A'}`);
        // Clear and re-render markers immediately
        clearAllMarkers();
        setTimeout(() => {
          renderMarkers();
          console.log(`[useMapMarkers] 일자 선택 이벤트 후 마커 재렌더링 완료 - 일자: ${event.detail.day}`);
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
        console.log(`[useMapMarkers] dayRenderingStarted 이벤트 수신 - 일자: ${event.detail.day}, 타임스탬프: ${event.detail.timestamp || 'N/A'}`);
        // 기존 마커 모두 제거
        clearAllMarkers();
        
        // 약간의 지연 후 마커 렌더링 실행
        setTimeout(() => {
          renderMarkers();
          console.log(`[useMapMarkers] dayRenderingStarted 이벤트 후 마커 재렌더링 완료 - 일자: ${event.detail.day}`);
          
          // 마커 렌더링 완료 이벤트 발생
          window.dispatchEvent(new CustomEvent('markerRenderingComplete', { 
            detail: { day: event.detail.day, timestamp: Date.now() } 
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
