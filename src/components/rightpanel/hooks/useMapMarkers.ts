
import { useRef, useEffect } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core'; // ItineraryPlaceWithTime needed for properties like isFallback
import { clearMarkers, getMarkerIconOptions, createNaverMarker, createNaverLatLng, fitBoundsToPlaces, panToPosition } from '@/utils/map/mapDrawing';

interface UseMapMarkersProps {
  places: Place[]; // General list of places (e.g., recommendations)
  selectedPlace: Place | null; // For highlighting a single place (e.g., opening info window)
  itinerary: ItineraryDay[] | null; // Full itinerary data
  selectedDay: number | null; // Currently selected day in the itinerary
  selectedPlaces?: Place[]; // Places selected in a list/cart, to be styled as 'candidate'
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string; // Another way to highlight a specific place
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
  const prevPlacesRef = useRef<Place[] | null>(null); // To track changes in the 'places' prop

  const clearAllMarkers = () => {
    if (markersRef.current.length > 0) {
      console.log("[useMapMarkers] Clearing all existing markers:", markersRef.current.length);
      clearMarkers(markersRef.current);
      markersRef.current = [];
    }
  };

  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useMapMarkers] Map not ready or Naver API not loaded. Skipping marker update.");
      return;
    }

    // Determine if a significant change occurred that requires re-rendering markers
    const itineraryChanged = prevItineraryRef.current !== itinerary;
    const dayChanged = selectedDay !== prevSelectedDayRef.current;
    const placesPropChanged = prevPlacesRef.current !== places; // Check if the general places list changed
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
      prevPlacesRef.current = places; // Store current general places list
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

    // Priority: If an itinerary is active and a day is selected, show that day's places.
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMapMarkers] Displaying itinerary day ${selectedDay}: ${placesToDisplay.length} places.`);
      } else {
        console.log(`[useMapMarkers] Itinerary active for day ${selectedDay}, but no places found for this day. No itinerary markers shown.`);
        placesToDisplay = []; // Explicitly empty
      }
    } 
    // Fallback: If no itinerary is active (or no day selected within an active itinerary, though user wants selected day only)
    // then show general places from the 'places' prop.
    // Crucially, if an itinerary *is* active, we DON'T fall back to general 'places' here,
    // ensuring "장소 추천 목록" markers are hidden when itinerary is active.
    else if (!itinerary || itinerary.length === 0) {
        placesToDisplay = places || [];
        console.log(`[useMapMarkers] No active itinerary. Displaying general places: ${placesToDisplay.length}`);
    } else {
        // Itinerary exists but no selected day. Per user request, show nothing from itinerary then.
        // And also don't show general places.
        console.log(`[useMapMarkers] Itinerary active, but no specific day selected. No markers shown.`);
        placesToDisplay = []; // Explicitly empty
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
            isInfoWindowTarget || isGeneralHighlightTarget, // isSelected
            isGloballySelectedCandidate && !isInfoWindowTarget && !isGeneralHighlightTarget, // isCandidate
            isDisplayingItineraryDay, // isItineraryDayPlace
            isDisplayingItineraryDay ? index + 1 : undefined // itineraryOrder
          );
          
          const marker = createNaverMarker(map, position, iconOptions, place.name);
          
          if (onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) {
            window.naver.maps.Event.addListener(marker, 'click', () => {
              console.log(`[useMapMarkers] Marker clicked: ${place.name} (Index: ${index}, ItineraryDayPlace: ${isDisplayingItineraryDay})`);
              onPlaceClick(place, index);
            });
          }
          newMarkers.push(marker);
        });
        markersRef.current = newMarkers;

        if (validPlacesToDisplay.length > 0) {
            // Only fit bounds if not focusing on a single selected/highlighted place
            if (!(selectedPlace || highlightPlaceId)) {
                console.log("[useMapMarkers] Fitting map bounds to displayed markers.");
                fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
            } else if ((selectedPlace || (highlightPlaceId && placesToDisplay.find(p => p.id === highlightPlaceId )))) {
                // If a place is selected/highlighted, pan to it instead of fitting all bounds
                // This logic is handled below
            }
        }
      }
    } else {
      console.log("[useMapMarkers] No places to display after filtering.");
    }
    
    // Handle focusing on selected/highlighted place (pan and zoom)
    const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplay.find(p => p.id === highlightPlaceId) : null);
    if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
      console.log(`[useMapMarkers] Panning to focused place: ${placeToFocus.name}`);
      if (map.getZoom() < 15) map.setZoom(15, true); // Smooth zoom if too far out
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
