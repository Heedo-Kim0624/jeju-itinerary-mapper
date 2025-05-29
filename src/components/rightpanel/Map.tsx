import React, { useMemo, useEffect, useRef, useState } from 'react';
import { useMapContext } from './MapContext';
import MapLoadingOverlay from './MapLoadingOverlay';
import MapMarkers from './MapMarkers'; // Re-enable MapMarkers
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects';

interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const Map: React.FC<MapProps> = ({ 
  places, 
  selectedPlace, 
  itinerary, 
  selectedDay,
  selectedPlaces = []
}) => {
  const {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    showGeoJson,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    checkGeoJsonMapping,
    renderItineraryRoute,
    serverRoutesData,
    isGeoJsonLoaded,
  } = useMapContext();

  // 마커 렌더링 강제 트리거를 위한 상태
  const [mapKey, setMapKey] = useState<number>(0);
  
  // 이전 선택 일자 추적을 위한 ref
  const prevSelectedDayRef = useRef<number | null>(null);

  // 현재 선택된 일자의 itinerary 데이터
  const currentDayItinerary = useMemo(() => {
    if (itinerary && selectedDay !== null) {
      const dayData = itinerary.find(day => day.day === selectedDay);
      console.log(`[Map] 일자 ${selectedDay}의 itinerary 데이터 찾음:`, 
        dayData ? {
          day: dayData.day,
          placesCount: dayData.places?.length || 0,
          placesIds: dayData.places?.map(p => p.id)
        } : 'not found');
      return dayData;
    }
    return null;
  }, [itinerary, selectedDay]);

  // 표시할 장소들 결정 - selectedDay에 따라 올바른 장소들을 선택
  const placesToDisplay = useMemo((): ItineraryPlaceWithTime[] | Place[] => {
    console.log('[Map] placesToDisplay 계산 중:', {
      selectedDay,
      hasItinerary: !!itinerary,
      currentDayItinerary: !!currentDayItinerary,
      currentDayPlacesCount: currentDayItinerary?.places?.length || 0
    });
    
    if (selectedDay !== null && currentDayItinerary && currentDayItinerary.places && currentDayItinerary.places.length > 0) {
      // 깊은 복사를 통해 places 배열의 참조를 완전히 새로 생성
      const placesDeepCopy = JSON.parse(JSON.stringify(currentDayItinerary.places));
      console.log(`[Map] 일자 ${selectedDay}의 장소 데이터 사용:`, 
        placesDeepCopy.map((p: any, idx: number) => ({ 
          index: idx + 1, 
          id: p.id,
          name: p.name, 
          x: p.x, 
          y: p.y 
        })));
      return placesDeepCopy;
    }
    
    console.log('[Map] 일반 장소 데이터 사용:', 
      places.map(p => ({ 
        id: p.id,
        name: p.name, 
        x: p.x, 
        y: p.y 
      })));
    return [...places]; // 얕은 복사라도 수행하여 참조 분리
  }, [selectedDay, currentDayItinerary, places]);

  // 일자 변경 시 로깅 및 디버깅
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current) {
      console.log(`[Map] 선택된 일자가 ${prevSelectedDayRef.current} → ${selectedDay}로 변경됨`);
      
      // 마커 렌더링 강제 트리거
      setMapKey(prev => prev + 1);
      
      if (itinerary) {
        // 각 일자별 places 배열이 서로 다른 참조인지 확인
        const placesReferences: any = {};
        itinerary.forEach(day => {
          placesReferences[`day${day.day}`] = {
            reference: day.places,
            count: day.places?.length || 0,
            ids: day.places?.map(p => p.id).slice(0, 3) // 처음 3개 ID만 로깅
          };
        });
        console.log('[Map] 일자별 places 배열 참조 확인:', placesReferences);
      }
      
      prevSelectedDayRef.current = selectedDay;
    }
  }, [selectedDay, itinerary]);

  // dayRenderingStarted 이벤트 리스너
  useEffect(() => {
    const handleDayRenderingStarted = (event: any) => {
      if (event.detail && typeof event.detail.day === 'number') {
        console.log(`[Map] dayRenderingStarted 이벤트 수신 - 일자: ${event.detail.day}`);
        
        // 마커 렌더링 강제 트리거
        setMapKey(prev => prev + 1);
      }
    };
    
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted);
    
    return () => {
      window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted);
    };
  }, []);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    renderItineraryRoute,
    serverRoutesData,
    checkGeoJsonMapping,
    places,
    itinerary,
    selectedDay,
  });

  console.log('[Map] 렌더링 - selectedDay:', selectedDay, 'placesToDisplay 개수:', placesToDisplay.length, 'mapKey:', mapKey);

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      {/* Render numbered markers for itinerary places */}
      <MapMarkers
        key={`map-markers-${mapKey}-${selectedDay}`}
        places={placesToDisplay}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
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
