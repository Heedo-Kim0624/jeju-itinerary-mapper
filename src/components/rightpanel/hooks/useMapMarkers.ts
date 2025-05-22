
import { useRef, useEffect } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers } from '@/utils/map/mapCleanup';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { isSameId } from '@/utils/id-utils';

interface UseMapMarkersProps {
  places: Place[]; // These are general places, not necessarily itinerary places
  selectedPlace: Place | ItineraryPlaceWithTime | null; // Can be either type
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[]; // These are candidate places usually
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string | number; // CHANGED TYPE
}

export const useMapMarkers = ({
  places, // General places, typically from search results or category selection
  selectedPlace, // InfoWindow target
  itinerary,
  selectedDay,
  selectedPlaces = [], // Candidate places for orange markers
  onPlaceClick,
  highlightPlaceId, // General highlight target (e.g. hover from list)
}: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  // prevPlacesRef tracks the 'places' prop, not itinerary places for map display
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
    // Check if the 'places' prop (search results/category places) has changed
    const placesPropChanged = prevPlacesRef.current !== places; 
    const selectedPlaceChanged = !(isSameId((markersRef.current as any)._prevSelectedPlace?.id, selectedPlace?.id)) || (markersRef.current as any)._prevSelectedPlace !== selectedPlace;

    const highlightChanged = !(isSameId((markersRef.current as any)._prevHighlightPlaceId, highlightPlaceId));
    const selectedPlacesListChanged = JSON.stringify(selectedPlaces) !== JSON.stringify((markersRef.current as any)._prevSelectedPlacesList);
    
    if (itineraryChanged || dayChanged || placesPropChanged || selectedPlaceChanged || highlightChanged || selectedPlacesListChanged) {
      console.log("[useMapMarkers] Change detected, regenerating markers:", {
        itineraryChanged,
        dayChanged,
        placesPropChanged, // Log change in 'places' prop
        selectedDay,
        itineraryLength: itinerary?.length,
        placesLength: places?.length, // Log length of 'places' prop
      });

      clearAllMarkers();

      prevItineraryRef.current = itinerary;
      prevSelectedDayRef.current = selectedDay;
      prevPlacesRef.current = places; // Update prevPlacesRef with current 'places' prop
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
    let placesToDisplayOnMap: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;
    const displayedPlaceIdSet = new Set<string | number>(); // CHANGED TYPE, tracks IDs on map

    // If an itinerary is active and a day is selected, prioritize itinerary places for that day
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData?.places && currentDayData.places.length > 0) {
        currentDayData.places.forEach(place => {
          if (!displayedPlaceIdSet.has(place.id)) {
            placesToDisplayOnMap.push(place);
            displayedPlaceIdSet.add(place.id);
          }
        });
        isDisplayingItineraryDay = true;
        console.log(`[useMapMarkers] Displaying ${placesToDisplayOnMap.length} unique places from itinerary day ${selectedDay}.`);
      } else {
         console.log(`[useMapMarkers] Itinerary day ${selectedDay} selected, but no places found. Will show general places if any.`);
      }
    }
    
    // If not displaying a specific itinerary day (or day has no places), show general 'places' prop
    // and ensure they are not duplicates of already added itinerary places.
    if (!isDisplayingItineraryDay || placesToDisplayOnMap.length === 0) {
      if (places && places.length > 0) {
        const generalPlacesToAdd = places.filter(p => !displayedPlaceIdSet.has(p.id));
        placesToDisplayOnMap.push(...generalPlacesToAdd);
        generalPlacesToAdd.forEach(p => displayedPlaceIdSet.add(p.id)); // Add their IDs to the set
        console.log(`[useMapMarkers] Added ${generalPlacesToAdd.length} general places. Total to display: ${placesToDisplayOnMap.length}`);
      } else if (!isDisplayingItineraryDay) {
         console.log("[useMapMarkers] No itinerary day active and no general places to display.");
      }
    }
    
    if (placesToDisplayOnMap.length > 0) {
      const validPlacesToDisplay = placesToDisplayOnMap.filter(p => {
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
          
          // Check if the place is among the 'selectedPlaces' prop (candidate places)
          const isCandidateFromProp = selectedPlaces.some(sp => isSameId(sp.id, place.id));
          const isInfoWindowTarget = selectedPlace ? isSameId(selectedPlace.id, place.id) : false;
          const isGeneralHighlightTarget = highlightPlaceId !== undefined ? isSameId(place.id, highlightPlaceId) : false;
          
          // Determine if this place is from the active itinerary day context
          // 'place' could be from itinerary or from general 'places' prop
          const isItineraryPlaceContext = itinerary?.some(day => day.day === selectedDay && day.places.some(p => isSameId(p.id, place.id))) ?? false;
          
          // Itinerary order only applies if we are displaying an itinerary day AND the place is part of it.
          let itineraryOrder;
          if (isItineraryPlaceContext) {
            const dayData = itinerary!.find(d => d.day === selectedDay);
            const placeIndexInDay = dayData?.places.findIndex(p => isSameId(p.id, place.id));
            if (placeIndexInDay !== undefined && placeIndexInDay !== -1) {
              itineraryOrder = placeIndexInDay + 1;
            }
          }

          const iconOptions = getMarkerIconOptions(
            place, // Pass the Place or ItineraryPlaceWithTime object
            isInfoWindowTarget || isGeneralHighlightTarget, // isSelected state
            isCandidateFromProp && !isInfoWindowTarget && !isGeneralHighlightTarget, // isCandidate state
            isItineraryPlaceContext, // isItineraryDayPlace state for red markers
            itineraryOrder // itineraryOrder for numbered labels
          );
          
          const marker = createNaverMarker(map, position, iconOptions, place.name);
          
          if (marker && onPlaceClick && window.naver && window.naver.maps && window.naver.maps.Event) {
            window.naver.maps.Event.addListener(marker, 'click', () => {
              console.log(`[useMapMarkers] Marker clicked: ${place.name} (ID: ${place.id}, ItineraryDayPlace: ${isItineraryPlaceContext})`);
              onPlaceClick(place, index); // index here is from validPlacesToDisplay, might not be itinerary order
            });
          }
          if (marker) newMarkers.push(marker);
        });
        markersRef.current = newMarkers;
    
        if (validPlacesToDisplay.length > 0) {
          if (!(selectedPlace || highlightPlaceId)) {
            console.log("[useMapMarkers] Fitting map bounds to displayed markers.");
            fitBoundsToPlaces(map, validPlacesToDisplay as Place[]); // fitBoundsToPlaces expects Place[]
          }
        }
      }
    } else {
      console.log("[useMapMarkers] No places to display after filtering.");
    }
    
    // 이 부분이 수정되어야 합니다. validPlacesToDisplay는 이 스코프에서 접근할 수 없습니다.
    // 선택된 장소나 강조 표시할 장소를 기준으로 지도를 이동시키는 코드입니다.
    const placeToFocus = selectedPlace || (highlightPlaceId !== undefined ? 
      placesToDisplayOnMap.find(p => isSameId(p.id, highlightPlaceId)) : null);
      
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
