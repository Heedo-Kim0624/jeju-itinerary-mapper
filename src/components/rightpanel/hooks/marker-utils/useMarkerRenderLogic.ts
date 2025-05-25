import { useCallback, useRef, useEffect } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil, clearInfoWindows as clearInfoWindowsUtil } from '@/utils/map/mapCleanup';

interface MarkerRenderLogicProps {
  places: Place[];
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
  const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([]);
  const userHasInteractedWithMapRef = useRef(false);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevPlacesLengthRef = useRef<number>(0);

  // Track user interaction with the map to prevent automatic re-centering
  useEffect(() => {
    if (map && isMapInitialized && window.naver?.maps?.Event) {
      const dragListener = window.naver.maps.Event.addListener(map, 'dragstart', () => {
        userHasInteractedWithMapRef.current = true;
      });
      const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
        userHasInteractedWithMapRef.current = true;
      });
      const mousedownListener = window.naver.maps.Event.addListener(map, 'mousedown', () => {
        userHasInteractedWithMapRef.current = true;
      });
      return () => {
        window.naver.maps.Event.removeListener(dragListener);
        window.naver.maps.Event.removeListener(zoomListener);
        window.naver.maps.Event.removeListener(mousedownListener);
      };
    }
  }, [map, isMapInitialized]);

  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.warn("[useMarkerRenderLogic] Map or Naver API not ready, aborting marker rendering.");
      return;
    }
    
    // console.log(`[useMarkerRenderLogic] Initiating renderMarkers. Current selectedDay: ${selectedDay}, Previous selectedDay from ref: ${prevSelectedDayRef.current}`);

    // Clear existing markers and info windows AT THE START
    // This ensures a clean slate before adding new markers.
    markersRef.current = clearMarkersUtil(markersRef.current);
    infoWindowsRef.current = clearInfoWindowsUtil(infoWindowsRef.current);
    // console.log(`[useMarkerRenderLogic] Cleared existing markers (${markersRef.current.length}) and infoWindows (${infoWindowsRef.current.length}).`);

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;
    let viewResetNeeded = false;

    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        // console.log(`[useMarkerRenderLogic] Displaying ITINERARY for day ${selectedDay}: ${placesToDisplay.length} places.`);
        
        if (prevSelectedDayRef.current !== selectedDay) {
          // console.log(`[useMarkerRenderLogic] Day changed from ${prevSelectedDayRef.current} to ${selectedDay}. Resetting map interaction state.`);
          userHasInteractedWithMapRef.current = false; // Reset interaction state on day change
          viewResetNeeded = true;
        }
      } else {
        // console.log(`[useMarkerRenderLogic] Selected day ${selectedDay} has no places or data. No itinerary markers to display.`);
      }
    } else if (selectedDay === null && places.length > 0) {
      placesToDisplay = places; // General search places
      isDisplayingItineraryDay = false;
      // console.log(`[useMarkerRenderLogic] Displaying GENERAL places: ${placesToDisplay.length}.`);
      
      if (prevSelectedDayRef.current !== null || prevPlacesLengthRef.current !== places.length) {
        // console.log(`[useMarkerRenderLogic] Switched to general places or general places list changed. Resetting map interaction state.`);
        userHasInteractedWithMapRef.current = false;
        viewResetNeeded = true;
      }
    } else {
      // console.log(`[useMarkerRenderLogic] No day selected and no general places, or selected day has no itinerary. No markers to display.`);
    }
    
    // Update tracking references *after* comparison
    prevSelectedDayRef.current = selectedDay;
    prevPlacesLengthRef.current = places.length;

    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
        // console.log("[useMarkerRenderLogic] No valid places to display markers for.");
        // If map view needed reset (e.g. day changed to an empty day), still might want to adjust map
        // For now, if no markers, we don't explicitly change view.
        // Consider resetting to a default view if viewResetNeeded is true and no markers.
        return;
    }
    
    // console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} new markers. Mode: ${isDisplayingItineraryDay ? 'Itinerary' : 'General'}`);

    const newMarkers: naver.maps.Marker[] = [];
    const newInfoWindows: naver.maps.InfoWindow[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTargetGlobal = selectedPlace?.id === place.id; // This is for opening info window automatically
      const isGeneralHighlightTarget = highlightPlaceId === place.id; // This is for styling highlight
      
      const iconOptions = getMarkerIconOptions(
        place,
        isInfoWindowTargetGlobal || isGeneralHighlightTarget, // isSelected for styling
        isGloballySelectedCandidate && !isInfoWindowTargetGlobal && !isGeneralHighlightTarget, // isCandidate for styling
        isDisplayingItineraryDay,
        isDisplayingItineraryDay ? index + 1 : undefined // itineraryOrder
      );
      
      let zIndex = 50; // Default for general markers
      if (isDisplayingItineraryDay) zIndex = 150 - index; // Itinerary markers get higher z-index, ordered
      if (isInfoWindowTargetGlobal || isGeneralHighlightTarget) zIndex = 200; // Highlighted/selected on top

      const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
      if (!marker) return;

      const infoWindowContent = `
        <div style="padding:12px;min-width:200px;max-width:280px;line-height:1.5;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.15);border-radius:6px;">
          <strong style="font-size:16px;display:block;margin-bottom:6px;color:#1a1a1a;">${place.name || '이름 없음'}</strong>
          ${place.address ? `<p style="margin:0 0 4px;color:#444;font-size:12px;"><i class="lucide lucide-map-pin" style="font-size:12px;vertical-align:middle;margin-right:3px;"></i>${place.address}</p>` : ''}
          ${(place as ItineraryPlaceWithTime).category ? `<p style="margin:0 0 4px;color:#007bff;font-size:12px;font-weight:500;">${(place as ItineraryPlaceWithTime).category}</p>` : ''}
          ${isDisplayingItineraryDay ? `<div style="margin-top:8px;padding:3px 8px;background:#f0f4ff;color:#333;font-size:12px;border-radius:4px;display:inline-block;">순서: ${index + 1}</div>` : ''}
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
        pixelOffset: new window.naver.maps.Point(0, - (iconOptions.size?.height || 32) / 2 - 10) // Adjust based on actual marker size
      });

      newInfoWindows.push(infoWindow);

      if (window.naver?.maps?.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindowsRef.current.forEach((iw, idx) => {
            // Only close other info windows, not this one if it's already open (to allow toggling)
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
            onPlaceClick(place, index); // Pass original place object
          }
        });
      }
      
      // Automatically open info window if it's the selectedPlace
      if (isInfoWindowTargetGlobal && map) {
        // console.log(`[useMarkerRenderLogic] Auto-opening info window for selected place: ${place.name}`);
        // Ensure other info windows are closed before opening a new one.
        infoWindowsRef.current.forEach(iw => { if (iw !== infoWindow) iw.close(); });
        infoWindow.open(map, marker);
      }
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows; // Store all created info windows

    if ((viewResetNeeded || !userHasInteractedWithMapRef.current) && validPlacesToDisplay.length > 0) {
      // console.log(`[useMarkerRenderLogic] Adjusting map view. View reset needed: ${viewResetNeeded}, User interacted: ${userHasInteractedWithMapRef.current}`);
      const placeToFocus = selectedPlace && validPlacesToDisplay.some(p => p.id === selectedPlace.id) ? selectedPlace : 
                           (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

      if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
        // console.log(`[useMarkerRenderLogic] Panning to focused place: ${placeToFocus.name}`);
        if (map.getZoom() < 15) map.setZoom(15, true); // Ensure a reasonable zoom level
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else {
        // console.log(`[useMarkerRenderLogic] Fitting bounds to ${validPlacesToDisplay.length} places.`);
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    } else {
      // console.log(`[useMarkerRenderLogic] User has interacted with map OR no view reset needed, skipping automatic bounds fitting. User interaction: ${userHasInteractedWithMapRef.current}, View reset: ${viewResetNeeded}`);
    }
  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, infoWindowsRef, // Added infoWindowsRef
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId, userHasInteractedWithMapRef, // Added userHasInteractedWithMapRef
    prevSelectedDayRef, prevPlacesLengthRef // Added these refs
  ]);

  return { renderMarkers };
};
