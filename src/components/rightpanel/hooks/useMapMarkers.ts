
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
  const updateCountRef = useRef<number>(0);
  const [shouldUpdateMarkers, setShouldUpdateMarkers] = useState<boolean>(false);
  
  // 마커를 제거하는 함수
  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      // 로그 제거
      markersRef.current = clearMarkers(markersRef.current);
    }
  }, []);

  // 명시적으로 마커 재생성을 강제하는 함수 - 무한 루프 방지를 위해 최적화
  const forceMarkerUpdate = useCallback(() => {
    // 이미 마커 업데이트가 예정되어 있다면 추가 업데이트 요청 무시
    if (!shouldUpdateMarkers) {
      clearAllMarkers();
      setShouldUpdateMarkers(true);
      updateCountRef.current += 1;
    }
  }, [shouldUpdateMarkers, clearAllMarkers]);

  // selectedDay가 변경될 때만 마커 업데이트 트리거
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current && isMapInitialized) {
      prevSelectedDayRef.current = selectedDay;
      forceMarkerUpdate();
    }
  }, [selectedDay, isMapInitialized, forceMarkerUpdate]);

  // 일정이 변경될 때 마커 업데이트 트리거
  useEffect(() => {
    if (itinerary !== prevItineraryRef.current && isMapInitialized) {
      prevItineraryRef.current = itinerary;
      forceMarkerUpdate();
    }
  }, [itinerary, isMapInitialized, forceMarkerUpdate]);

  // places prop이 변경될 때 마커 업데이트 트리거 
  useEffect(() => {
    // 깊은 비교 대신 참조 비교만 사용하여 불필요한 업데이트 방지
    if (places !== prevPlacesRef.current && isMapInitialized) {
      prevPlacesRef.current = places;
      forceMarkerUpdate();
    }
  }, [places, isMapInitialized, forceMarkerUpdate]);

  // 이벤트 리스너 등록
  useEffect(() => {
    const handleItineraryDaySelected = () => {
      // 이벤트 발생 시 마커 업데이트 예약
      forceMarkerUpdate();
    };

    window.addEventListener('itineraryDaySelected', handleItineraryDaySelected);
    
    return () => {
      window.removeEventListener('itineraryDaySelected', handleItineraryDaySelected);
    };
  }, [forceMarkerUpdate]);

  // 마커 렌더링 로직
  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      return;
    }
    
    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    // 일정이 있고 선택된 일자가 있는 경우
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
      }
    } else if (places.length > 0) {
      // 일정이 없는 경우 기본 장소 표시
      placesToDisplay = places;
    }
    
    if (placesToDisplay.length === 0) {
      return;
    }
    
    const validPlacesToDisplay = placesToDisplay.filter(p => {
      if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
      return false;
    });

    if (validPlacesToDisplay.length === 0) {
      return;
    }
    
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
    itinerary, selectedDay, selectedPlaces, onPlaceClick, highlightPlaceId
  ]);

  // shouldUpdateMarkers가 true일 때만 마커를 업데이트하고 상태 초기화
  useEffect(() => {
    if (shouldUpdateMarkers && isMapInitialized) {
      clearAllMarkers();
      renderMarkers();
      setShouldUpdateMarkers(false);
    }
  }, [shouldUpdateMarkers, isMapInitialized, clearAllMarkers, renderMarkers]);
  
  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate
  };
};
