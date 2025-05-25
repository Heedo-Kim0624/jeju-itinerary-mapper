
import { useCallback } from 'react';
// useMapContext import는 더 이상 필요하지 않습니다. props로 map, isMapInitialized, isNaverLoaded를 받습니다.
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

interface MarkerRenderLogicProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  map: any; // naver.maps.Map | null 타입이 더 정확할 수 있습니다.
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
  map, // Prop으로 전달받음
  isMapInitialized, // Prop으로 전달받음
  isNaverLoaded, // Prop으로 전달받음
}: MarkerRenderLogicProps) => {
  // const { map, isMapInitialized, isNaverLoaded } = useMapContext(); // 이 줄은 제거합니다.

  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useMarkerRenderLogic] Cannot render markers: map not initialized or Naver not loaded");
      return;
    }
    
    if (markersRef.current.length > 0) {
        console.log(`[useMarkerRenderLogic] Clearing markers from ref: ${markersRef.current.length}`);
        markersRef.current = clearMarkersUtil(markersRef.current);
    }
    
    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    console.log(`[useMarkerRenderLogic] Rendering markers: {selectedDay: ${selectedDay}, itineraryLength: ${itinerary?.length || 0}, placesLength: ${places.length}}`);

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMarkerRenderLogic] Displaying itinerary day ${selectedDay}: ${currentDayData.places.length} places`);
      } else {
        console.log(`[useMarkerRenderLogic] No places found for itinerary day ${selectedDay}`);
      }
    } else if (places.length > 0) {
      placesToDisplay = places;
      console.log(`[useMarkerRenderLogic] No active itinerary. Displaying ${places.length} places from search.`);
    } else {
      console.log("[useMarkerRenderLogic] No places to display after filtering.");
    }
    
    if (placesToDisplay.length === 0) {
      return;
    }
    
    const validPlacesToDisplay = placesToDisplay.filter(p => 
        p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No valid coordinates found in places to display");
      return;
    }
    
    console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} markers`);
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
        console.log("[useMarkerRenderLogic] Fitting map bounds to displayed markers");
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    }
    
    const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplay.find(p => p.id === highlightPlaceId) : null);
    if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
      if (map.getZoom() < 15) map.setZoom(15, true);
      panToPosition(map, placeToFocus.y, placeToFocus.x);
    }
  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, // map, isMapInitialized, isNaverLoaded가 props로 사용됨
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId,
  ]);

  return { renderMarkers };
};
