
import { useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

interface MarkerRenderLogicProps {
  places: Place[]; // 일반 검색 결과 또는 기본 장소 목록
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  map: any; 
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
}

export const useMarkerRenderLogic = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
  markersRef,
  map, 
  isMapInitialized, 
  isNaverLoaded, 
}: MarkerRenderLogicProps) => {

  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useMarkerRenderLogic] Map not initialized or Naver not loaded, cannot render markers.");
      return;
    }
    
    if (markersRef.current.length > 0) {
        console.log(`[useMarkerRenderLogic] Clearing ${markersRef.current.length} existing markers from ref.`);
        markersRef.current = clearMarkersUtil(markersRef.current);
    }
    
    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    console.log(`[useMarkerRenderLogic] Determining places to display: selectedDay=${selectedDay}, itinerary items=${itinerary?.length || 0}, general places=${places.length}`);

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMarkerRenderLogic] Displaying itinerary for day ${selectedDay}: ${currentDayData.places.length} places.`);
      } else {
        // 선택된 날짜에 일정이 없는 경우, 빈 배열로 설정 (초록 마커 방지)
        placesToDisplay = []; 
        console.log(`[useMarkerRenderLogic] No places found for itinerary day ${selectedDay}. Displaying 0 markers.`);
      }
    } else if (places.length > 0 && selectedDay === null) { // selectedDay가 null일 때만 일반 장소 표시
      placesToDisplay = places;
      console.log(`[useMarkerRenderLogic] No active itinerary day. Displaying ${places.length} general places from search/props.`);
    } else {
      console.log("[useMarkerRenderLogic] No itinerary day selected or no general places to display. Displaying 0 markers.");
      // placesToDisplay는 이미 빈 배열이거나 위 조건에서 설정됨
    }
    
    if (placesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No places to display after filtering logic. Returning.");
      return;
    }
    
    const validPlacesToDisplay = placesToDisplay.filter(p => 
        p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No valid coordinates found in places to display. Returning.");
      return;
    }
    
    console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} new markers.`);
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
        isInfoWindowTarget || isGeneralHighlightTarget, // isSelected
        isGloballySelectedCandidate && !isInfoWindowTarget && !isGeneralHighlightTarget, // isCandidate
        isDisplayingItineraryDay,
        isDisplayingItineraryDay ? index + 1 : undefined // itineraryOrder
      );
      
      // Z-index 결정 로직
      let zIndex = 50; // 기본 z-index (일반 장소 마커)
      if (isDisplayingItineraryDay) {
        zIndex = 150 - index; // 일정 마커 (순서에 따라 약간 다르게)
      }
      if (isInfoWindowTarget || isGeneralHighlightTarget) {
        zIndex = 200; // 선택/강조된 마커는 최상단
      }

      const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
      
      if (marker && onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          onPlaceClick(place, index);
        });
      }
      
      if (marker) newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    console.log(`[useMarkerRenderLogic] ${newMarkers.length} markers added to ref.`);

    if (newMarkers.length > 0) {
      if (!(selectedPlace || highlightPlaceId) && isDisplayingItineraryDay) { // 일정 표시 중이고 특정 장소 하이라이트가 아닐 때만 전체 핏
        console.log("[useMarkerRenderLogic] Fitting map bounds to displayed itinerary markers.");
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      } else if (newMarkers.length > 0 && !isDisplayingItineraryDay && !(selectedPlace || highlightPlaceId) ) { // 일반 장소 표시 중
         console.log("[useMarkerRenderLogic] Fitting map bounds to displayed general places markers.");
         fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    }
    
    const placeToFocus = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);
    if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
      console.log(`[useMarkerRenderLogic] Panning to focused place: ${placeToFocus.name}`);
      if (map.getZoom() < 15) map.setZoom(15, true); // 확대 레벨 조정
      panToPosition(map, placeToFocus.y, placeToFocus.x);
    }
  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, 
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId,
  ]);

  return { renderMarkers };
};
