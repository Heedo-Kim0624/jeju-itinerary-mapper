
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
  const prevMarkerUpdateTriggerRef = useRef<number>(0);
  const [markerUpdateTrigger, setMarkerUpdateTrigger] = useState(0);
  
  // 마커를 제거하는 함수
  const clearAllMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      console.log("[useMapMarkers] Clearing all existing markers:", markersRef.current.length);
      markersRef.current = clearMarkers(markersRef.current);
    }
  }, []);

  // 명시적으로 마커 재생성을 강제하는 함수
  const forceMarkerUpdate = useCallback(() => {
    if (prevMarkerUpdateTriggerRef.current === markerUpdateTrigger) {
      clearAllMarkers();
      setMarkerUpdateTrigger(prev => prev + 1);
      prevMarkerUpdateTriggerRef.current = markerUpdateTrigger + 1;
      console.log("[useMapMarkers] Force marker update triggered", markerUpdateTrigger + 1);
    }
  }, [markerUpdateTrigger, clearAllMarkers]);

  // selectedDay가 변경될 때만 마커 업데이트 트리거
  useEffect(() => {
    if (selectedDay !== prevSelectedDayRef.current && isMapInitialized) {
      console.log(`[useMapMarkers] Day changed from ${prevSelectedDayRef.current} to ${selectedDay} - Updating markers`);
      prevSelectedDayRef.current = selectedDay;
      forceMarkerUpdate();
    }
  }, [selectedDay, isMapInitialized, forceMarkerUpdate]);

  // 마커 렌더링 로직
  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      return;
    }
    
    console.log("[useMapMarkers] Rendering markers:", {
      selectedDay,
      itineraryLength: itinerary?.length,
      placesLength: places?.length
    });

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    // 일정이 있고 선택된 일자가 있는 경우
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMapMarkers] Displaying itinerary day ${selectedDay}: ${placesToDisplay.length} places`);
      } else {
        console.log(`[useMapMarkers] No places found for day ${selectedDay}`);
      }
    } else if (places.length > 0) {
      // 일정이 없는 경우 기본 장소 표시
      placesToDisplay = places;
      console.log(`[useMapMarkers] Displaying ${placesToDisplay.length} places from search`);
    }
    
    if (placesToDisplay.length === 0) {
      console.log("[useMapMarkers] No places to display after filtering");
      return;
    }
    
    const validPlacesToDisplay = placesToDisplay.filter(p => {
      if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
      console.warn(`[useMapMarkers] Place '${p.name}' has invalid coordinates: x=${p.x}, y=${p.y}`);
      return false;
    });

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMapMarkers] No valid places to display markers for");
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
      console.log(`[useMapMarkers] Panning to ${placeToFocus.name}`);
      if (map.getZoom() < 15) map.setZoom(15, true);
      panToPosition(map, placeToFocus.y, placeToFocus.x);
    }
  }, [
    map, isMapInitialized, isNaverLoaded, places, selectedPlace,
    itinerary, selectedDay, selectedPlaces, onPlaceClick, highlightPlaceId
  ]);

  // itinerary, selectedDay 또는 마커 업데이트 트리거가 변경될 때 마커 렌더링
  useEffect(() => {
    clearAllMarkers();
    renderMarkers();
    
    prevItineraryRef.current = itinerary;
    prevPlacesRef.current = places;
  }, [
    clearAllMarkers, renderMarkers, markerUpdateTrigger,
    itinerary, selectedDay
  ]);
  
  return {
    markers: markersRef.current,
    clearAllMarkers,
    forceMarkerUpdate
  };
};
