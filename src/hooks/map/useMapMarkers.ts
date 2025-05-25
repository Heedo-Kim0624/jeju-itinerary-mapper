
import { useCallback, useEffect, useState, useRef } from 'react';
import { ItineraryPlace, ItineraryDay as CoreItineraryDay } from '@/types/core'; 
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { createNaverMarker } from '@/utils/map/markerUtils'; 
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';
import { useEventEmitter } from '@/hooks/events/useEventEmitter';

interface UseMapMarkersProps {
  map: any; 
  itinerary: CoreItineraryDay[] | null; 
  onPlaceClick?: (place: ItineraryPlace, index: number) => void; 
}

export const useMapMarkers = ({ map, itinerary, onPlaceClick }: UseMapMarkersProps) => {
  const [activeMarkersState, setActiveMarkersState] = useState<any[]>([]); // For external consumers if needed
  const currentDayMapMarkersRef = useRef<any[]>([]); 
  const currentDayInfoWindowsRef = useRef<any[]>([]);

  const { selectedMapDay, getDayRouteData, setDayRouteData } = useRouteMemoryStore();
  const { subscribe } = useEventEmitter();

  const clearCurrentDayMapElements = useCallback(() => {
    currentDayMapMarkersRef.current.forEach(marker => marker?.setMap(null));
    currentDayMapMarkersRef.current = [];
    currentDayInfoWindowsRef.current.forEach(iw => iw?.close());
    currentDayInfoWindowsRef.current = [];
  }, []);
  
  const createAndDisplayMarkersForDay = useCallback((dayToRender: number) => {
    clearCurrentDayMapElements(); 

    if (!map || !itinerary) {
      console.warn('[useMapMarkers] Map or itinerary N/A for markers.');
      setActiveMarkersState([]);
      return;
    }

    const currentDayItineraryData = itinerary.find(day => day.day === dayToRender);
    if (!currentDayItineraryData || !currentDayItineraryData.places || currentDayItineraryData.places.length === 0) {
      console.warn(`[useMapMarkers] No places for day ${dayToRender}.`);
      setActiveMarkersState([]);
      // Ensure store reflects no markers for this day if we're actively trying to render it
      const existingDayData = getDayRouteData(dayToRender);
      if (existingDayData && existingDayData.markers.length > 0) {
        setDayRouteData(dayToRender, { markers: [] });
      }
      return;
    }

    console.log(`[useMapMarkers] Creating markers for day ${dayToRender}: ${currentDayItineraryData.places.length} places.`);
    
    const newMapMarkers: any[] = [];
    const newInfoWindows: any[] = [];

    currentDayItineraryData.places.forEach((place, index) => {
      if (place.x == null || place.y == null || isNaN(Number(place.x)) || isNaN(Number(place.y))) {
        console.warn(`[useMapMarkers] Place '${place.name}' missing/invalid coords (day ${dayToRender}).`);
        return;
      }

      const position = createNaverLatLng(place.y as number, place.x as number);
      if (!position) return;

      const categoryKey = place.category ? mapCategoryNameToKey(place.category) : 'default';
      const categoryColor = getCategoryColor(categoryKey);

      const markerIcon = {
        content: `
          <div style="width:30px;height:30px;border-radius:50%;background-color:${categoryColor};color:white;font-weight:bold;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,0.3);border:1.5px solid white;font-size:13px;">
            ${index + 1}
          </div>`,
        size: new window.naver.maps.Size(30, 30),
        anchor: new window.naver.maps.Point(15, 15)
      };
      
      const mapMarker = createNaverMarker(map, position, markerIcon, place.name, true, true);
      if (!mapMarker) return;

      const infoWindowContent = `
        <div style="padding:10px;min-width:150px;line-height:1.5;">
           <div style="font-weight:bold;margin-bottom:5px;">${place.name}</div>
           ${place.category ? `<div style="font-size:12px;color:${categoryColor};">${place.category}</div>` : ''}
           ${place.address ? `<div style="font-size:12px;">${place.address}</div>` : ''}
        </div>`;

      const infoWindow = new window.naver.maps.InfoWindow({
          content: infoWindowContent,
          maxWidth: 250, backgroundColor: "#fff", borderColor: "#ccc", borderWidth: 1,
          anchorSize: new window.naver.maps.Size(10, 10), anchorSkew: true,
          pixelOffset: new window.naver.maps.Point(0, -10)
      });

      window.naver.maps.Event.addListener(mapMarker, 'click', () => {
        currentDayInfoWindowsRef.current.forEach(iw => iw.close()); 
        infoWindow.open(map, mapMarker);
        if (onPlaceClick) onPlaceClick(place, index);
      });
      
      newMapMarkers.push(mapMarker);
      newInfoWindows.push(infoWindow);
    });

    currentDayMapMarkersRef.current = newMapMarkers; 
    currentDayInfoWindowsRef.current = newInfoWindows;
    setActiveMarkersState(newMapMarkers); 

    setDayRouteData(dayToRender, { markers: newMapMarkers });
    console.log(`[useMapMarkers] Day ${dayToRender} markers created: ${newMapMarkers.length}.`);
  }, [map, itinerary, clearCurrentDayMapElements, setDayRouteData, onPlaceClick, getDayRouteData]);

  useEffect(() => {
    if (map && itinerary) {
      console.log(`[useMapMarkers] Effect for selectedMapDay: ${selectedMapDay}. Updating markers.`);
      createAndDisplayMarkersForDay(selectedMapDay);
    }
    return () => {
      // console.log('[useMapMarkers] Cleaning up markers on unmount/map/itinerary change.');
      // clearCurrentDayMapElements(); // This might clear too aggressively if map/itinerary changes but day is same
    };
  }, [map, itinerary, selectedMapDay, createAndDisplayMarkersForDay]);

  useEffect(() => {
    const handleMapDayChanged = (eventData: { day: number }) => {
      if (eventData && typeof eventData.day === 'number' && map && itinerary) {
        console.log(`[useMapMarkers] 'mapDayChanged' event for day ${eventData.day}. Updating markers.`);
        if (eventData.day !== selectedMapDay) { 
             createAndDisplayMarkersForDay(eventData.day);
        } else {
            // If it's the same day, an explicit event might still mean "refresh"
             createAndDisplayMarkersForDay(eventData.day);
        }
      }
    };
    const unsubscribe = subscribe<{day: number}>('mapDayChanged', handleMapDayChanged);
    return () => unsubscribe();
  }, [subscribe, map, itinerary, createAndDisplayMarkersForDay, selectedMapDay]);

  useEffect(() => { // Global cleanup when hook itself is unmounted
    return () => {
        console.log('[useMapMarkers] Hook unmounting, clearing all its markers.');
        clearCurrentDayMapElements();
    }
  }, [clearCurrentDayMapElements]);


  return { activeMarkers: activeMarkersState }; 
};
