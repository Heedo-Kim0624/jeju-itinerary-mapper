
import { useRef, useEffect } from 'react';
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

  const clearAllMarkers = () => {
    if (markersRef.current.length > 0) {
      console.log("[useMapMarkers] Clearing all existing markers:", markersRef.current.length);
      markersRef.current = clearMarkers(markersRef.current);
    }
  };

  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useMapMarkers] Map not ready or Naver API not loaded. Skipping marker update.");
      return;
    }

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = selectedDay !== prevSelectedDayRef.current;
    const placesPropChanged = prevPlacesRef.current !== places;
    const selectedPlaceChanged = selectedPlace !== (markersRef.current as any)._prevSelectedPlace;
    const highlightChanged = highlightPlaceId !== (markersRef.current as any)._prevHighlightPlaceId;
    const selectedPlacesListChanged = JSON.stringify(selectedPlaces) !== JSON.stringify((markersRef.current as any)._prevSelectedPlacesList);

    if (itineraryChanged || dayChanged || placesPropChanged || selectedPlaceChanged || highlightChanged || selectedPlacesListChanged) {
      console.log("[useMapMarkers] Change detected, regenerating markers:", {
        itineraryChanged,
        dayChanged,
        placesPropChanged,
        selectedDay,
        itineraryLength: itinerary?.length,
        placesLength: places?.length,
      });

      clearAllMarkers();

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevPlacesRef.current = places;
      (markersRef.current as any)._prevSelectedPlace = selectedPlace;
      (markersRef.current as any)._prevHighlightPlaceId = highlightPlaceId;
      (markersRef.current as any)._prevSelectedPlacesList = selectedPlaces;

      renderMarkers();
    }
  }, [
    map, isMapInitialized, isNaverLoaded,
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId
  ]);

  const renderMarkers = () => {
    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;
    const placeIdSet = new Set<string>();

    // Modified logic to only display places that are in the itinerary
    if (itinerary && itinerary.length > 0) {
      // Get all place IDs from the itinerary
      const itineraryPlaceIds = new Set<string>();
      
      // If there's a selected day, show only that day's places
      if (selectedDay !== null) {
        const currentDayData = itinerary.find(day => day.day === selectedDay);
        if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
          // Filter out duplicate places by ID
          const uniquePlaces: (Place | ItineraryPlaceWithTime)[] = [];
          currentDayData.places.forEach(place => {
            if (!placeIdSet.has(place.id)) {
              placeIdSet.add(place.id);
              uniquePlaces.push(place);
            }
          });
          
          placesToDisplay = uniquePlaces;
          isDisplayingItineraryDay = true;
          console.log(`[useMapMarkers] Displaying itinerary day ${selectedDay}: ${placesToDisplay.length} unique places.`);
        } else {
          console.log(`[useMapMarkers] Itinerary active for day ${selectedDay}, but no places found for this day. No itinerary markers shown.`);
        }
      } else {
        // No specific day selected but itinerary exists - collect all place IDs from all days
        itinerary.forEach(day => {
          day.places.forEach(place => {
            itineraryPlaceIds.add(place.id);
            if (!placeIdSet.has(place.id)) {
              placeIdSet.add(place.id);
              placesToDisplay.push(place);
            }
          });
        });
        
        console.log(`[useMapMarkers] No specific day selected. Displaying ${placesToDisplay.length} unique places from all days.`);
      }
    } else {
      console.log(`[useMapMarkers] No active itinerary. No markers will be shown.`);
    }
    
    if (placesToDisplay.length > 0) {
      const validPlacesToDisplay = placesToDisplay.filter(p => {
        if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
        console.warn(`[useMapMarkers] Place '${p.name}' has invalid coordinates: x=${p.x}, y=${p.y}`);
        return false;
      });

      if (validPlacesToDisplay.length === 0) {
        console.log("[useMapMarkers] No valid places to display markers for.");
      } else {
        console.log(`[useMapMarkers] Creating markers for ${validPlacesToDisplay.length} valid places.`);
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
              console.log(`[useMapMarkers] Marker clicked: ${place.name} (Index: ${index}, ItineraryDayPlace: ${isDisplayingItineraryDay})`);
              onPlaceClick(place, index);
            });
          }
          if (marker) newMarkers.push(marker);
        });
        markersRef.current = newMarkers;

        if (validPlacesToDisplay.length > 0) {
            if (!(selectedPlace || highlightPlaceId)) {
                console.log("[useMapMarkers] Fitting map bounds to displayed markers.");
                fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
            }
        }
      }
    } else {
      console.log("[useMapMarkers] No places to display after filtering.");
    }
    
    const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplay.find(p => p.id === highlightPlaceId) : null);
    if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
      console.log(`[useMapMarkers] Panning to focused place: ${placeToFocus.name}`);
      if (map.getZoom() < 15) map.setZoom(15, true);
      panToPosition(map, placeToFocus.y, placeToFocus.x);
    } else if (placeToFocus) {
      console.warn(`[useMapMarkers] Target focus place '${placeToFocus.name}' has no valid coordinates.`);
    }
  };
  
  return {
    markers: markersRef.current,
    clearAllMarkers
  };
};
