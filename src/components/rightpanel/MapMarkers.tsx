import React, { useEffect, useRef, useState } from 'react';
import { useMapMarkers } from './hooks/useMapMarkers';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

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
  // 마커 렌더링 강제 트리거를 위한 상태
  const [renderKey, setRenderKey] = useState<number>(0);
  const prevSelectedDayRef = useRef<number | null>(null);
  
  // 일자 변경 감지 및 마커 렌더링 강제 트리거
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current) {
      console.log(`[MapMarkers] 일자 변경 감지: ${prevSelectedDayRef.current} → ${selectedDay}, 마커 렌더링 강제 트리거`);
      
      // 마커 렌더링 강제 트리거
      setRenderKey(prev => prev + 1);
      
      // 현재 일자 저장
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay]);

  // 마커 렌더링 로직 사용
  const { markers, clearAllMarkers } = useMapMarkers({
    places,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
  });

  // 컴포넌트 언마운트 시 마커 정리
  useEffect(() => {
    return () => {
      clearAllMarkers();
    };
  }, [clearAllMarkers]);

  // 일자 변경 이벤트 리스너
  useEffect(() => {
    const handleDayRenderingStarted = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[MapMarkers] dayRenderingStarted 이벤트 수신 - 일자: ${event.detail.day}`);
        
        // 마커 렌더링 강제 트리거
        setRenderKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted);
    
    return () => {
      window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted);
    };
  }, []);

  // 마커 개수 로깅
  useEffect(() => {
    console.log(`[MapMarkers] 현재 마커 개수: ${markers.length}, 렌더링 키: ${renderKey}, 선택된 일자: ${selectedDay}`);
  }, [markers.length, renderKey, selectedDay]);

  // 빈 div 반환 - 실제 마커는 useMapMarkers 훅에서 관리
  return <div key={`markers-container-${renderKey}`} />;
};

export default MapMarkers;
