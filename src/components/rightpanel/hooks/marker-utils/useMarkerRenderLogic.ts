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
      return;
    }

    // Clear existing markers and info windows
    if (markersRef.current.length > 0) {
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
    if (infoWindowsRef.current.length > 0) {
      infoWindowsRef.current = clearInfoWindowsUtil(infoWindowsRef.current);
    }

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;
    let viewResetNeeded = false;

    // Determine which places to display based on selection
    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      // Show places from the selected itinerary day
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        
        // Reset map view when changing days
        if (prevSelectedDayRef.current !== selectedDay) {
          userHasInteractedWithMapRef.current = false;
          viewResetNeeded = true;
        }
      }
    } else if (selectedDay === null && places.length > 0) {
      // Show general places when no day is selected
      placesToDisplay = places;
      
      // Reset map view when switching from itinerary to general places
      if (prevSelectedDayRef.current !== null || prevPlacesLengthRef.current !== places.length) {
        userHasInteractedWithMapRef.current = false;
        viewResetNeeded = true;
      }
    }
    
    // Update tracking references
    prevSelectedDayRef.current = selectedDay;
    prevPlacesLengthRef.current = places.length;

    // Filter places with valid coordinates
    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    // Create markers for valid places
    const newMarkers: naver.maps.Marker[] = [];
    const newInfoWindows: naver.maps.InfoWindow[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTargetGlobal = selectedPlace?.id === place.id;
      const isGeneralHighlightTarget = highlightPlaceId === place.id;
      
      const iconOptions = getMarkerIconOptions(
        place,
        isInfoWindowTargetGlobal || isGeneralHighlightTarget,
        isGloballySelectedCandidate && !isInfoWindowTargetGlobal && !isGeneralHighlightTarget,
        isDisplayingItineraryDay,
        isDisplayingItineraryDay ? index + 1 : undefined
      );
      
      let zIndex = 50;
      if (isDisplayingItineraryDay) zIndex = 150 - index;
      if (isInfoWindowTargetGlobal || isGeneralHighlightTarget) zIndex = 200;

      const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
      if (!marker) return;

      // Enhanced info window content
      const infoWindowContent = `
        <div style="padding:12px;min-width:200px;max-width:280px;line-height:1.5;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,0.15);border-radius:6px;">
          <strong style="font-size:16px;display:block;margin-bottom:6px;color:#1a1a1a;">${place.name || '이름 없음'}</strong>
          ${place.address ? `<p style="margin:0 0 4px;color:#444;font-size:12px;"><i class="material-icons" style="font-size:12px;vertical-align:middle;margin-right:3px;">location_on</i>${place.address}</p>` : ''}
          ${(place as ItineraryPlaceWithTime).category ? `<p style="margin:0 0 4px;color:#007bff;font-size:12px;font-weight:500;">${(place as ItineraryPlaceWithTime).category}</p>` : ''}
          ${isDisplayingItineraryDay ? `<div style="margin-top:8px;padding:3px 8px;background:#f0f4ff;color:#333;font-size:12px;border-radius:4px;display:inline-block;">순서: ${index + 1}</div>` : ''}
          ${place.phone ? `<p style="margin:4px 0 0;color:#666;font-size:12px;"><i class="material-icons" style="font-size:12px;vertical-align:middle;margin-right:3px;">phone</i>${place.phone}</p>` : ''}
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
          // Close all other info windows
          infoWindowsRef.current.forEach(iw => {
            if (iw !== infoWindow) iw.close();
          });
          
          // Toggle this info window
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
          
          // Call the click handler if provided
          if (onPlaceClick) {
            onPlaceClick(place, index);
          }
        });
      }
      
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows;

    // Adjust map view if needed (day change or first render)
    if (viewResetNeeded || (!userHasInteractedWithMapRef.current && newMarkers.length > 0)) {
      if (newMarkers.length === 0) {
        // No markers to display, keep current view
      } else {
        const placeToFocus = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

        if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
          // Focus on selected place
          if (map.getZoom() < 15) map.setZoom(15, true);
          panToPosition(map, placeToFocus.y, placeToFocus.x);
        } else {
          // Fit bounds to show all markers
          fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
        }
      }
    }
  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, 
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId
  ]);

  return { renderMarkers };
};
