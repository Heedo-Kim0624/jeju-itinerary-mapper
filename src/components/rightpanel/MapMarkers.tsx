import React, { useEffect, useMemo, useRef } from 'react';
import { useMapMarkers } from './hooks/useMapMarkers';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapContext } from './MapContext';

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
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  // 이전 selectedDay 값을 추적하기 위한 ref
  const prevSelectedDayRef = useRef<number | null>(null);
  const { currentRenderingDay } = useMapContext();
  
  // Get the current day's itinerary data
  const currentDayItinerary = selectedDay !== null && itinerary 
    ? itinerary.find(day => day.day === selectedDay) 
    : null;

  // MapMarkers는 이제 Map.tsx에서 전달받은 places를 그대로 사용
  // Map.tsx에서 이미 올바른 일차의 장소들을 필터링해서 전달함
  const placesToDisplay = places;
  
  console.log('[MapMarkers] Received props:', {
    selectedDay,
    currentRenderingDay,
    placesToDisplayCount: placesToDisplay.length,
    isItineraryDay: !!currentDayItinerary,
    places: placesToDisplay.map((p, idx) => ({ 
      index: idx + 1, 
      name: p.name, 
      x: p.x, 
      y: p.y 
    }))
  });

  const { markers, clearAllMarkers, forceMarkerUpdate } = useMapMarkers({
    places: placesToDisplay,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 일자 변경 이벤트 리스너 추가
  useEffect(() => {
    const handleDayRenderingStarted = (event: CustomEvent) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] 'dayRenderingStarted' event received for day ${event.detail.day}`);
        clearAllMarkers(); // 즉시 기존 마커 제거
        
        // 약간의 지연 후 마커 업데이트 강제 실행
        setTimeout(() => {
          forceMarkerUpdate();
        }, 50);
      }
    };
    
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted as EventListener);
    
    return () => {
      window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted as EventListener);
    };
  }, [clearAllMarkers, forceMarkerUpdate]);

  // Force marker update when selectedDay or places change - this is the key fix
  useEffect(() => {
    // selectedDay가 변경되었는지 확인
    const dayChanged = prevSelectedDayRef.current !== selectedDay;
    
    if (dayChanged) {
      console.log(`[MapMarkers] Selected day changed from ${prevSelectedDayRef.current} to ${selectedDay}, forcing immediate marker update`);
      clearAllMarkers(); // Clear existing markers immediately
      
      // Use a very short delay to ensure state is updated
      const timeoutId = setTimeout(() => {
        forceMarkerUpdate(); // Force new markers to render
        console.log(`[MapMarkers] Forced marker update after day change to ${selectedDay}`);
      }, 50);
      
      // 현재 selectedDay를 ref에 저장
      prevSelectedDayRef.current = selectedDay;
      
      return () => clearTimeout(timeoutId);
    } else if (places.length > 0) {
      // 일자는 같지만 places가 변경된 경우에도 마커 업데이트
      console.log(`[MapMarkers] Places changed (count: ${places.length}) for day ${selectedDay}, updating markers`);
      const timeoutId = setTimeout(() => {
        forceMarkerUpdate();
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedDay, places, clearAllMarkers, forceMarkerUpdate]);

  // Log marker count for debugging
  useEffect(() => {
    console.log(`[MapMarkers] Current markers count: ${markers.length} for day ${selectedDay}`);
  }, [markers.length, selectedDay]);

  return null; // This component only manages markers, doesn't render JSX
};

export default React.memo(MapMarkers);
