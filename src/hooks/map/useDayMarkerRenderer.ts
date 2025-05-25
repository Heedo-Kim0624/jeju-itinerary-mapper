
import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouteMemoryStore } from './useRouteMemoryStore';
import type { ItineraryPlace } from '@/types/core/route-data';

interface UseDayMarkerRendererProps {
  map: any; 
  isNaverLoaded: boolean;
}

export const useDayMarkerRenderer = ({ map, isNaverLoaded }: UseDayMarkerRendererProps) => {
  const selectedDay = useRouteMemoryStore(state => state.selectedDay);
  const getDayMarkerData = useRouteMemoryStore(state => state.getDayMarkerData);
  
  const [_renderedMarkers, setRenderedMarkers] = useState<any[]>([]); // Internal state for React re-renders if needed
  const markersRef = useRef<any[]>([]);
  const infoWindowsRef = useRef<any[]>([]);
  
  const createMarker = useCallback((place: ItineraryPlace, index: number) => {
    if (!map || !window.naver || !isNaverLoaded) return null;
    if (typeof place.x !== 'number' || typeof place.y !== 'number' || isNaN(place.x) || isNaN(place.y)) {
      console.warn(`[useDayMarkerRenderer] Invalid coordinates for place: ${place.name} (x: ${place.x}, y: ${place.y})`);
      return null;
    }
    
    const position = new window.naver.maps.LatLng(place.y, place.x);
    
    const markerIcon = {
      content: `
        <div style="
          width: 30px; height: 30px; border-radius: 50%; 
          background-color: #FF3B30; /* iOS Red */
          color: white; font-weight: bold; display: flex;
          align-items: center; justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2); border: 1.5px solid white;
          font-size: 13px;
        ">${index + 1}</div>
      `,
      size: new window.naver.maps.Size(30, 30),
      anchor: new window.naver.maps.Point(15, 15)
    };
    
    const marker = new window.naver.maps.Marker({
      position,
      map,
      icon: markerIcon,
      title: place.name,
      zIndex: 100 + index 
    });
    
    const contentString = `
      <div style="padding: 8px; max-width: 200px; font-family: inherit; font-size: 12px;">
        <h4 style="font-weight: 600; margin: 0 0 4px 0; font-size: 14px;">${place.name}</h4>
        ${place.address ? `<p style="color: #555; margin: 2px 0;">${place.address}</p>` : ''}
        ${place.category ? `<p style="color: #007AFF; margin: 2px 0; font-size: 11px;">${place.category}</p>` : ''}
        <strong style="color: #FF3B30; font-size: 13px;">방문 순서: ${index + 1}</strong>
      </div>
    `;
    
    const infoWindow = new window.naver.maps.InfoWindow({
      content: contentString,
      maxWidth: 220,
      backgroundColor: "white",
      borderColor: "#ccc",
      borderWidth: 1,
      anchorSize: new window.naver.maps.Size(10, 5),
      anchorSkew: true,
      pixelOffset: new window.naver.maps.Point(0, -10)
    });
    
    window.naver.maps.Event.addListener(marker, 'click', () => {
      if (infoWindow.getMap()) {
        infoWindow.close();
      } else {
        infoWindowsRef.current.forEach(iw => iw.close());
        infoWindow.open(map, marker);
      }
    });
    
    infoWindowsRef.current.push(infoWindow);
    return marker;
  }, [map, isNaverLoaded]);
  
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(marker => {
      if (marker && typeof marker.setMap === 'function') marker.setMap(null);
    });
    infoWindowsRef.current.forEach(infoWindow => {
      if (infoWindow && typeof infoWindow.close === 'function') infoWindow.close();
    });
    markersRef.current = [];
    infoWindowsRef.current = [];
    setRenderedMarkers([]); // Update React state
    // console.log('[useDayMarkerRenderer] All markers cleared.');
  }, []);

  const renderDayMarkers = useCallback(() => {
    if (!map || !isNaverLoaded) return;
    
    clearMarkers();
    
    const dayData = getDayMarkerData(selectedDay);
    if (!dayData || !dayData.places || dayData.places.length === 0) {
      // console.log(`[useDayMarkerRenderer] No marker data for day ${selectedDay}.`);
      return;
    }
    
    // console.log(`[useDayMarkerRenderer] Rendering ${dayData.places.length} markers for day ${selectedDay}.`);
    
    const newMarkers = dayData.places
      .map((place, index) => createMarker(place, index))
      .filter(marker => marker !== null) as any[];
    
    markersRef.current = newMarkers;
    setRenderedMarkers(newMarkers); // Update React state
    
    if (newMarkers.length > 0) {
      const bounds = new window.naver.maps.LatLngBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getPosition()));
      map.morph(bounds.getCenter(), map.getZoom(), { duration: 300}); // Smooth transition
      setTimeout(() => map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 }), 350);
    }
  }, [map, isNaverLoaded, selectedDay, getDayMarkerData, createMarker, clearMarkers]);
  
  useEffect(() => {
    if (map && isNaverLoaded) {
      // console.log(`[useDayMarkerRenderer] Effect triggered for day ${selectedDay}. Rendering markers.`);
      renderDayMarkers();
    }
    // Cleanup on unmount or when map/isNaverLoaded changes
    return () => {
        // console.log("[useDayMarkerRenderer] Cleanup: clearing markers.");
        // clearMarkers(); // Potential issue: This clearMarkers is from the closure of the effect.
                          // If selectedDay changes rapidly, it might clear markers for the new day.
                          // The clearMarkers at the beginning of renderDayMarkers should be sufficient.
    };
  }, [map, isNaverLoaded, selectedDay, renderDayMarkers]); // renderDayMarkers dependency is important
  
  return {
    renderedMarkers: markersRef.current, // Return the ref's current value
    renderDayMarkers,
    clearAllMarkers: clearMarkers // Expose clearMarkers as clearAllMarkers
  };
};
