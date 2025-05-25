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

    // 항상 먼저 기존 마커 모두 제거
    if (markersRef.current.length > 0) {
      console.log(`[useMarkerRenderLogic] Clearing ${markersRef.current.length} existing markers from ref.`);
      markersRef.current = clearMarkersUtil(markersRef.current); // Ensure this returns the new empty array
    } else {
      console.log(`[useMarkerRenderLogic] No existing markers in ref to clear.`);
    }

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    console.log(`[useMarkerRenderLogic] Determining places to display: selectedDay=${selectedDay}, itinerary items=${itinerary?.length || 0}, general places=${places.length}`);

    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMarkerRenderLogic] Displaying ITINERARY for day ${selectedDay}: ${currentDayData.places.length} places.`);
      } else {
        // 선택된 날짜에 일정이 없거나 장소가 없는 경우 (일정 생성 중이거나 빈 날짜일 수 있음)
        placesToDisplay = []; // 일반 장소 마커를 표시하지 않음
        console.log(`[useMarkerRenderLogic] No ITINERARY places for day ${selectedDay} or day data missing. Displaying 0 markers.`);
      }
    } else if (selectedDay === null && places.length > 0) {
      // 선택된 일자가 없을 때만 일반 검색 결과 (초록색) 장소 표시
      placesToDisplay = places;
      isDisplayingItineraryDay = false; // 명시적으로 false 설정
      console.log(`[useMarkerRenderLogic] No active itinerary day. Displaying ${places.length} GENERAL places from search/props.`);
    } else {
      // 그 외의 모든 경우 (예: selectedDay는 null이고 places도 비어있음)
      placesToDisplay = [];
      console.log("[useMarkerRenderLogic] No itinerary day selected AND no general places, OR itinerary data structure issue. Displaying 0 markers.");
    }

    if (placesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No places to display after filtering logic. Map will be empty of these markers.");
      // markersRef.current should already be empty from clearMarkersUtil above
      return;
    }

    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No valid coordinates found in places to display. Map will be empty of these markers.");
      // markersRef.current should already be empty
      return;
    }

    console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} new markers. Mode: ${isDisplayingItineraryDay ? 'Itinerary' : 'General'}`);
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
        isDisplayingItineraryDay, // True if displaying itinerary day places
        isDisplayingItineraryDay ? index + 1 : undefined // itineraryOrder only for itinerary days
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
    console.log(`[useMarkerRenderLogic] ${newMarkers.length} markers added to ref. Total in ref: ${markersRef.current.length}`);

    if (newMarkers.length > 0) {
      const placeToFocus = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

      if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
        console.log(`[useMarkerRenderLogic] Panning to focused place: ${placeToFocus.name}`);
        if (map.getZoom() < 15) map.setZoom(15, true);
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else {
        // 포커스할 특정 장소가 없을 때만 전체 뷰 조정
        console.log(`[useMarkerRenderLogic] Fitting map bounds to ${isDisplayingItineraryDay ? 'itinerary' : 'general'} markers.`);
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    }
  }, [
    map, isMapInitialized, isNaverLoaded, markersRef,
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId,
  ]);

  return { renderMarkers };
};
