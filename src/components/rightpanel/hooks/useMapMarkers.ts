
import { useRef, useEffect, useState, useCallback } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers } from '@/utils/map/mapCleanup';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';

interface UseMapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevPlacesRef = useRef<Place[] | null>(null);
  const updateRequestIdRef = useRef<number>(0);
  const [updateTriggerId, setUpdateTriggerId] = useState<number>(0);
  
  // 마커를 제거하는 함수
  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log(`[useMapMarkers] Clearing all existing markers: ${markersRef.current.length}`);
      markersRef.current = clearMarkers(markersRef.current);
    }
  }, []);

  // 명시적으로 마커 재생성을 강제하는 함수 (중복 호출 방지)
  const forceMarkerUpdate = useCallback(() => {
    // 이전 업데이트와 새 업데이트를 구별하기 위한 ID 증가
    const newUpdateId = updateRequestIdRef.current + 1;
    updateRequestIdRef.current = newUpdateId;
    
    // 약간의 지연을 두고 업데이트 트리거
    setTimeout(() => {
      // 다른 업데이트가 이미 예약되어 있지 않은 경우에만 실행
      if (updateRequestIdRef.current === newUpdateId) {
        setUpdateTriggerId(newUpdateId);
      }
    }, 50);
  }, []);

  // 이벤트 리스너 등록
  useEffect(() => {
    const handleItineraryDaySelected = (event: CustomEvent) => {
      const { day } = event.detail || {};
      if (day !== prevSelectedDayRef.current) {
        prevSelectedDayRef.current = day;
        forceMarkerUpdate();
      }
    };

    // 스케줄 생성 시작 이벤트 핸들러
    const handleStartScheduleGeneration = () => {
      console.log("[useMapMarkers] startScheduleGeneration 이벤트 감지됨 - 모든 마커 제거");
      clearAllMarkers();
    };

    // 이벤트 타입 캐스팅
    window.addEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
    window.addEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelected as EventListener);
      window.removeEventListener('startScheduleGeneration', handleStartScheduleGeneration);
    };
  }, [forceMarkerUpdate, clearAllMarkers]);

  // selectedDay, itinerary, places 변화 감지
  useEffect(() => {
    const needsUpdate = 
      selectedDay !== prevSelectedDayRef.current || 
      itinerary !== prevItineraryRef.current ||
      places !== prevPlacesRef.current;
    
    if (needsUpdate && isMapInitialized) {
      prevSelectedDayRef.current = selectedDay;
      prevItineraryRef.current = itinerary;
      prevPlacesRef.current = places;
      forceMarkerUpdate();
    }
  }, [selectedDay, itinerary, places, isMapInitialized, forceMarkerUpdate]);

  // 마커 렌더링 로직
  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      return;
    }
    
    // 먼저 기존 마커 제거
    clearAllMarkers();
    
    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    console.log(`[useMapMarkers] Rendering markers: {selectedDay: ${selectedDay}, itineraryLength: ${itinerary?.length || 0}, placesLength: ${places.length}}`);

    // 일정이 있고 선택된 일자가 있는 경우
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMapMarkers] Displaying itinerary day ${selectedDay}: ${currentDayData.places.length} places`);
      } else {
        console.log(`[useMapMarkers] No places found for itinerary day ${selectedDay}`);
      }
    } else if (places.length > 0) {
      // 일정이 없는 경우 기본 장소 표시
      placesToDisplay = places;
      console.log(`[useMapMarkers] No active itinerary. Displaying ${places.length} places from search.`);
    } else {
      console.log("[useMapMarkers] No places to display after filtering.");
    }
    
    if (placesToDisplay.length === 0) {
      return;
    }
    
    const validPlacesToDisplay = placesToDisplay.filter(p => {
      if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
      return false;
    });

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMapMarkers] No valid coordinates found in places to display");
      return;
    }
    
    console.log(`[useMapMarkers] Creating ${validPlacesToDisplay.length} markers`);
    const newMarkers: naver.maps.Marker[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTarget = selectedPlace?.id === place.id;
      const isGeneralHighlightTarget = highlightPlaceId === place.id;
      
      const iconOptions = getMarkerIconOptions(
        place,
        isInfoWindowTarget || isGeneralHighlightTarget,
        isGloballySelectedCandidate && !isInfoWindowTarget && !isGeneralHighlightTarget,
        isDisplayingItineraryDay,
        isDisplayingItineraryDay ? index + 1 : undefined
      );
      
      const marker = createNaverMarker(map, position, iconOptions, place.name);
      
      if (marker && onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onPlaceClick(place, index);
        });
      }
      
      if (marker) newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;

    if (newMarkers.length > 0) {
      if (!(selectedPlace || highlightPlaceId)) {
        console.log("[useMapMarkers] Fitting map bounds to displayed markers");
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    }
    
    // 선택된 장소로 이동
    const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplay.find(p => p.id === highlightPlaceId) : null);
    if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
      if (map.getZoom() < 15) map.setZoom(15, true);
      panToPosition(map, placeToFocus.y, placeToFocus.x);
    }
  }, [
    map, isMapInitialized, isNaverLoaded, places, selectedPlace,
    itinerary, selectedDay, selectedPlaces, onPlaceClick, highlightPlaceId,
    clearAllMarkers
  ]);

  // updateTriggerId가 변경될 때만 마커 업데이트
  useEffect(() => {
    if (updateTriggerId > 0 && isMapInitialized) {
      renderMarkers();
    }
  }, [updateTriggerId, isMapInitialized, renderMarkers]);
  
  // 컴포넌트 마운트 시 한 번만 초기 마커 렌더링
  useEffect(() => {
    if (isMapInitialized && map) {
      const timer = setTimeout(() => {
        forceMarkerUpdate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isMapInitialized, map, forceMarkerUpdate]);
  
  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate
  };
};
