
import { useCallback, useRef, useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil, clearInfoWindows as clearInfoWindowsUtil } from '@/utils/map/mapCleanup';

interface MarkerRenderLogicProps {
  places: Place[]; // These are expected to be pre-filtered by the caller if needed
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null; // Full itinerary for context
  selectedDay: number | null; // To determine if we are in "itinerary day mode"
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  map: any;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
}

export const useMarkerRenderLogic = ({
  places, // Assumed to be correctly filtered by MapMarkers.tsx for the selected day, or general places
  selectedPlace,
  itinerary, // Full itinerary passed for context
  selectedDay, // Used to determine if it's a day-specific view
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
  markersRef,
  map,
  isMapInitialized,
  isNaverLoaded,
}: MarkerRenderLogicProps) => {
  const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([]);
  const userHasInteractedWithMapRef = useRef(false);
  const prevSelectedDayRef = useRef<number | null>(null); // Tracks changes in selectedDay
  const prevPlacesRef = useRef<Place[]>([]); // Tracks changes in the places array itself

  // Track user interaction with the map to prevent automatic re-centering
  useEffect(() => {
    if (map && isMapInitialized && window.naver?.maps?.Event) {
      const listeners = [];
      
      listeners.push(window.naver.maps.Event.addListener(map, 'dragstart', () => {
        userHasInteractedWithMapRef.current = true;
      }));
      
      listeners.push(window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
        userHasInteractedWithMapRef.current = true;
      }));
      
      listeners.push(window.naver.maps.Event.addListener(map, 'mousedown', () => {
        userHasInteractedWithMapRef.current = true;
      }));
      
      return () => {
        listeners.forEach(listener => {
          window.naver.maps.Event.removeListener(listener);
        });
      };
    }
  }, [map, isMapInitialized]);

  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      return;
    }
    
    // Always clear existing markers first
    markersRef.current = clearMarkersUtil(markersRef.current);
    infoWindowsRef.current = clearInfoWindowsUtil(infoWindowsRef.current);

    // The 'places' prop is now assumed to be the correct set of places to display
    const placesToDisplay = places; 
    // Determine if displaying an itinerary day based on selectedDay and itinerary context
    const isDisplayingItineraryDay = selectedDay !== null && !!itinerary?.find(d => d.day === selectedDay);
    let viewResetNeeded = false;

    console.log('[useMarkerRenderLogic] Rendering markers:', {
      placesToDisplayCount: placesToDisplay.length,
      isDisplayingItineraryDay,
      selectedDay,
      places: placesToDisplay.map((p, idx) => ({ 
        order: idx + 1, 
        name: p.name, 
        coordinates: { x: p.x, y: p.y } 
      }))
    });

    // Check if view reset is needed due to day change
    if (prevSelectedDayRef.current !== selectedDay) {
      console.log(`[useMarkerRenderLogic] Day changed from ${prevSelectedDayRef.current} to ${selectedDay}, resetting view`);
      userHasInteractedWithMapRef.current = false; 
      viewResetNeeded = true;
      prevSelectedDayRef.current = selectedDay;
    }
    
    // Update places reference
    prevPlacesRef.current = placesToDisplay;

    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
      console.log('[useMarkerRenderLogic] No valid places to display');
      return;
    }
    
    const newMarkers: naver.maps.Marker[] = [];
    const newInfoWindows: naver.maps.InfoWindow[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTargetGlobal = selectedPlace?.id === place.id;
      const isGeneralHighlightTarget = highlightPlaceId === place.id;
      
      // For itinerary days, always show numbered markers in chronological order
      // selectedDay 매개변수를 getMarkerIconOptions에 전달
      const iconOptions = getMarkerIconOptions(
        place,
        isInfoWindowTargetGlobal || isGeneralHighlightTarget,
        isGloballySelectedCandidate && !isInfoWindowTargetGlobal && !isGeneralHighlightTarget,
        isDisplayingItineraryDay, // This determines if we show numbered markers
        isDisplayingItineraryDay ? index + 1 : undefined, // Chronological order number (1, 2, 3, etc.)
        selectedDay // 선택된 일차 전달
      );
      
      let zIndex = 50;
      if (isDisplayingItineraryDay) zIndex = 150 - index; // Higher numbers appear on top for earlier places
      if (isInfoWindowTargetGlobal || isGeneralHighlightTarget) zIndex = 200;

      const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
      if (!marker) return;

      const infoWindowContent = `
        <div style="padding:12px;min-width:200px;max-width:280px;line-height:1.5;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.15);border-radius:6px;">
          <strong style="font-size:16px;display:block;margin-bottom:6px;color:#1a1a1a;">${place.name || '이름 없음'}</strong>
          ${place.address ? `<p style="margin:0 0 4px;color:#444;font-size:12px;"><i class="lucide lucide-map-pin" style="font-size:12px;vertical-align:middle;margin-right:3px;"></i>${place.address}</p>` : ''}
          ${(place as ItineraryPlaceWithTime).category ? `<p style="margin:0 0 4px;color:#007bff;font-size:12px;font-weight:500;">${(place as ItineraryPlaceWithTime).category}</p>` : ''}
          ${isDisplayingItineraryDay ? `<div style="margin-top:8px;padding:4px 8px;background:#e3f2fd;color:#1976d2;font-size:12px;border-radius:4px;display:inline-block;font-weight:600;">방문 순서: ${index + 1}</div>` : ''}
          ${place.phone ? `<p style="margin:4px 0 0;color:#666;font-size:12px;"><i class="lucide lucide-phone" style="font-size:12px;vertical-align:middle;margin-right:3px;"></i>${place.phone}</p>` : ''}
        </div>`;
      
      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoWindowContent,
        maxWidth: 300,
        backgroundColor: "#fff",
        borderColor: "#eaeaea",
        borderWidth: 1,
        anchorSize: new window.naver.maps.Size(12, 12),
        anchorSkew: true,
        anchorColor: "#fff",
        pixelOffset: new window.naver.maps.Point(0, - (iconOptions.size?.height || 32) / 2 - 10)
      });

      newInfoWindows.push(infoWindow);

      if (window.naver?.maps?.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          newInfoWindows.forEach((iw) => {
            if (iw !== infoWindow && iw.getMap()) {
              iw.close();
            }
          });
          
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
          
          if (onPlaceClick) {
            onPlaceClick(place, index);
          }
        });
      }
      
      if (isInfoWindowTargetGlobal && map) {
        newInfoWindows.forEach(iw => { if (iw !== infoWindow) iw.close(); });
        infoWindow.open(map, marker);
      }
      newMarkers.push(marker);

      console.log(`[useMarkerRenderLogic] Created marker ${index + 1} for ${place.name} at (${place.y}, ${place.x})`);
    });
    
    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows;

    console.log(`[useMarkerRenderLogic] Successfully created ${newMarkers.length} markers for day ${selectedDay}`);

    // Reset view when day changes or if user hasn't interacted
    if ((viewResetNeeded || !userHasInteractedWithMapRef.current) && validPlacesToDisplay.length > 0) {
      const placeToFocus = selectedPlace && validPlacesToDisplay.some(p => p.id === selectedPlace.id) ? selectedPlace : 
                           (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

      if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
        if (map.getZoom() < 15) map.setZoom(15, true);
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else {
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    }
  }, [
    map, isMapInitialized, isNaverLoaded,
    places, // Direct dependency on the (expected pre-filtered) places array
    selectedPlace?.id, // Depend on ID for stability if object reference changes
    itinerary, // Full itinerary for context
    selectedDay,
    selectedPlaces,
    onPlaceClick, // This should be stable if defined via useCallback higher up
    highlightPlaceId,
  ]);

  return { renderMarkers };
};
