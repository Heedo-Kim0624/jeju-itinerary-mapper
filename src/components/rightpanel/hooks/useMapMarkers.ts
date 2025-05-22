
import { useRef, useEffect } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers } from '@/utils/map/mapCleanup';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';

interface UseMapMarkersProps {
  places: Place[]; // Expects Place[] where id is string
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = ({
  places, // General places (e.g., from search results), id is string
  selectedPlace,
  itinerary, // Contains ItineraryPlaceWithTime where id can be string | number
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  // prevPlacesRef should reflect the type of places primarily used for marker rendering logic.
  // If itinerary is the main source, this might need adjustment or a different way to track changes.
  const prevPlacesRef = useRef<(Place | ItineraryPlaceWithTime)[] | null>(null);

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
    
    // For comparing 'places', we stringify it or use a deep comparison if needed.
    // For simplicity, direct comparison might be okay if immutability is maintained.
    const placesPropChanged = prevPlacesRef.current !== places; // This comparison is for the 'places' prop specifically.
                                                              // Marker rendering logic below uses 'placesToDisplay'.
                                                              // We need to decide what `prevPlacesRef` tracks if `places` prop itself isn't directly rendered.

    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = selectedDay !== prevSelectedDayRef.current;
    
    // A more robust check for selectedPlaces list change
    const selectedPlacesListChanged = JSON.stringify(selectedPlaces) !== JSON.stringify((markersRef.current as any)._prevSelectedPlacesList);

    const selectedPlaceChanged = selectedPlace?.id !== (markersRef.current as any)._prevSelectedPlaceId; // Compare by ID
    const highlightChanged = highlightPlaceId !== (markersRef.current as any)._prevHighlightPlaceId;


    if (itineraryChanged || dayChanged || placesPropChanged || selectedPlaceChanged || highlightChanged || selectedPlacesListChanged) {
      console.log("[useMapMarkers] Change detected, regenerating markers:", {
        itineraryChanged,
        dayChanged,
        placesPropChanged,
        selectedPlaceChanged,
        highlightChanged,
        selectedPlacesListChanged,
        selectedDay,
        itineraryLength: itinerary?.length,
        placesLength: places?.length, // Length of the 'places' prop
      });

      clearAllMarkers();

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      // prevPlacesRef should track the actual data source that was last rendered
      // This will be set after placesToDisplay is determined
      (markersRef.current as any)._prevSelectedPlaceId = selectedPlace?.id;
      (markersRef.current as any)._prevHighlightPlaceId = highlightPlaceId;
      (markersRef.current as any)._prevSelectedPlacesList = [...selectedPlaces]; // Store a copy

      renderMarkers();
    }
  }, [
    map, isMapInitialized, isNaverLoaded,
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId
  ]);

  const renderMarkers = () => {
    let placesToDisplay: ItineraryPlaceWithTime[] = []; // Raw places from itinerary
    let isDisplayingItineraryDay = false;
    const placeIdSet = new Set<string | number>(); // Handles both string and number IDs initially

    if (itinerary && itinerary.length > 0) {
      if (selectedDay !== null) {
        const currentDayData = itinerary.find(day => day.day === selectedDay);
        if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
          const uniquePlaces: ItineraryPlaceWithTime[] = [];
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
          console.log(`[useMapMarkers] Itinerary active for day ${selectedDay}, but no places found. No itinerary markers shown.`);
        }
      } else {
        itinerary.forEach(day => {
          day.places.forEach(place => {
            if (!placeIdSet.has(place.id)) {
              placeIdSet.add(place.id);
              placesToDisplay.push(place);
            }
          });
        });
        console.log(`[useMapMarkers] No specific day selected. Displaying ${placesToDisplay.length} unique places from all days.`);
      }
    } else if (places && places.length > 0) { // Fallback to 'places' prop if no itinerary
        // Assuming 'places' prop contains Place objects with string IDs
        // We need to adapt them slightly if `getMarkerIconOptions` expects ItineraryPlaceWithTime structure
        // or ensure `getMarkerIconOptions` can handle `Place` as well.
        // For now, let's assume they can be used if coordinates are present.
        placesToDisplay = places.map(p => ({...p, id: String(p.id)})); // Ensure ID is string | number, adapting Place to ItineraryPlaceWithTime-like
        console.log(`[useMapMarkers] No active itinerary. Displaying ${placesToDisplay.length} places from 'places' prop.`);
    } else {
      console.log(`[useMapMarkers] No active itinerary and no 'places' prop. No markers will be shown.`);
    }
    
    prevPlacesRef.current = placesToDisplay; // Track what was actually prepared for display

    // This is where validPlacesToDisplay was missing its definition scope
    const validPlacesToDisplay = placesToDisplay.filter(p => {
      if (p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))) return true;
      console.warn(`[useMapMarkers] Place '${p.name}' has invalid coordinates: x=${p.x}, y=${p.y}`);
      return false;
    });

    if (validPlacesToDisplay.length > 0) {
      console.log(`[useMapMarkers] Creating markers for ${validPlacesToDisplay.length} valid places.`);
      const newMarkers: naver.maps.Marker[] = [];

      validPlacesToDisplay.forEach((place, index) => {
        if (!window.naver || !window.naver.maps) return;

        const position = createNaverLatLng(place.y!, place.x!);
        if (!position) return;
        
        // Ensure place.id is string for comparison with selectedPlace.id (string) and highlightPlaceId (string)
        const placeIdStr = String(place.id); 
        const isGloballySelectedCandidate = selectedPlaces.some(sp => String(sp.id) === placeIdStr);
        const isInfoWindowTarget = selectedPlace?.id === placeIdStr;
        const isGeneralHighlightTarget = highlightPlaceId === placeIdStr;
        
        const iconOptions = getMarkerIconOptions(
          place, // ItineraryPlaceWithTime (id can be string | number)
          isInfoWindowTarget || isGeneralHighlightTarget,
          isGloballySelectedCandidate && !isInfoWindowTarget && !isGeneralHighlightTarget,
          isDisplayingItineraryDay,
          isDisplayingItineraryDay ? index + 1 : undefined
        );
        
        const marker = createNaverMarker(map, position, iconOptions, place.name);
        
        if (marker && onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) {
          window.naver.maps.Event.addListener(marker, 'click', () => {
            console.log(`[useMapMarkers] Marker clicked: ${place.name} (ID: ${placeIdStr}, Index: ${index}, ItineraryDayPlace: ${isDisplayingItineraryDay})`);
            onPlaceClick(place, index); // place is ItineraryPlaceWithTime
          });
        }
        if (marker) newMarkers.push(marker);
      });
      markersRef.current = newMarkers;

      // Adapt validPlacesToDisplay (ItineraryPlaceWithTime[]) to Place[] for fitBoundsToPlaces
      const placesForBounds: Place[] = validPlacesToDisplay.map(p => ({
        ...p,
        id: String(p.id), // Ensure id is string
      }));

      if (placesForBounds.length > 0) {
          if (!(selectedPlace || highlightPlaceId)) {
              console.log("[useMapMarkers] Fitting map bounds to displayed markers.");
              fitBoundsToPlaces(map, placesForBounds);
          }
      }
    } else {
      console.log("[useMapMarkers] No places to display after filtering.");
    }
    
    const placeToFocusObj = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => String(p.id) === highlightPlaceId) : null);

    if (placeToFocusObj && placeToFocusObj.y != null && placeToFocusObj.x != null) {
      console.log(`[useMapMarkers] Panning to focused place: ${placeToFocusObj.name}`);
      if (map.getZoom() < 15) map.setZoom(15, true); // Ensure map is zoomed in enough
      panToPosition(map, placeToFocusObj.y, placeToFocusObj.x);
    } else if (placeToFocusObj) {
      console.warn(`[useMapMarkers] Target focus place '${placeToFocusObj.name}' has no valid coordinates.`);
    }
  };
  
  return {
    markers: markersRef.current,
    clearAllMarkers
  };
};

