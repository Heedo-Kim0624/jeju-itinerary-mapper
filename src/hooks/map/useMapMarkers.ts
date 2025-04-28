
import { useCallback, useRef } from 'react';
import { Place } from '@/types/supabase';
import { getCategoryColor } from '@/utils/categoryColors';
import { clearMarkers, clearInfoWindows, clearPolylines } from '@/utils/map/mapCleanup';

export const useMapMarkers = (map: any) => {
  const markers = useRef<any[]>([]);
  const infoWindows = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);

  const createInfoWindowContent = useCallback((place: Place) => {
    return `
      <div style="padding: 5px; text-align: center;">
        <h6 style="margin:0; font-weight: bold;">${place.name}</h6>
        <small>${place.category}</small>
      </div>
    `;
  }, []);

  const clearMarkersAndUiElements = useCallback(() => {
    markers.current = clearMarkers(markers.current);
    infoWindows.current = clearInfoWindows(infoWindows.current);
    polylines.current = clearPolylines(polylines.current);
  }, []);

  const addMarkers = useCallback((
    placesToMark: Place[],
    opts?: { highlight?: boolean; isItinerary?: boolean; useRecommendedStyle?: boolean }
  ) => {
    if (!map || !window.naver) return;
    
    clearMarkersAndUiElements();
    
    const isItinerary = opts?.isItinerary || false;
    const highlight = opts?.highlight || false;
    const useRecommendedStyle = opts?.useRecommendedStyle || false;
    
    try {
      const bounds = new window.naver.maps.LatLngBounds();
      
      placesToMark.forEach((place, index) => {
        if (typeof place.x !== 'number' || typeof place.y !== 'number') {
          console.warn("Invalid coordinates for place:", place);
          return;
        }
        
        const position = new window.naver.maps.LatLng(place.y, place.x);
        bounds.extend(position);
        
        let markerColor = '#1F1F1F';
        
        if (highlight) {
          markerColor = '#FF0000';
        } else if (useRecommendedStyle) {
          markerColor = place.weight && place.weight > 0 ? '#FF0000' : '#1E88E5';
        } else {
          markerColor = getCategoryColor(place.category);
        }
        
        let markerIconContent;
        
        if (useRecommendedStyle) {
          markerIconContent = `
            <div style="position: relative;">
              <svg height="36" width="30" viewBox="0 0 24 36">
                <path d="M12 0C5.383 0 0 5.383 0 12c0 6.617 12 24 12 24s12-17.383 12-24C24 5.383 18.617 0 12 0z" 
                      fill="${markerColor}" />
                <circle cx="12" cy="12" r="6" fill="#FFFFFF" />
              </svg>
              ${isItinerary ? `<div style="position: absolute; top: 6px; left: 0; width: 100%; text-align: center; color: #000; font-size: 12px; font-weight: bold;">${index + 1}</div>` : ''}
            </div>
          `;
        } else {
          markerIconContent = `
            <div style="width: 24px; height: 24px; background-color: ${markerColor}; 
                    border-radius: 50%; display: flex; justify-content: center; align-items: center;
                    color: white; font-size: 12px; border: 2px solid white;">${isItinerary ? (index + 1) : ''}</div>
          `;
        }
        
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map,
          title: place.name,
          icon: {
            content: markerIconContent,
            size: useRecommendedStyle 
              ? new window.naver.maps.Size(30, 36)
              : new window.naver.maps.Size(24, 24),
            anchor: useRecommendedStyle 
              ? new window.naver.maps.Point(15, 36)
              : new window.naver.maps.Point(12, 12)
          },
          zIndex: isItinerary ? 2 : 1
        });
        
        markers.current.push(marker);

        const infoWindow = new window.naver.maps.InfoWindow({
          content: createInfoWindowContent(place),
          disableAnchor: true,
          borderWidth: 0,
          backgroundColor: "rgba(255,255,255,0.9)"
        });

        infoWindows.current.push(infoWindow);

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindows.current.forEach(iw => iw.close());
          infoWindow.open(map, marker);
        });
      });
      
      if (placesToMark.length > 0) {
        map.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
        
        const zoom = map.getZoom();
        if (zoom > 13) {
          map.setZoom(12);
        }
      }
    } catch (error) {
      console.error("Error adding markers:", error);
    }
  }, [map, clearMarkersAndUiElements, createInfoWindowContent]);

  return {
    addMarkers,
    clearMarkersAndUiElements,
    markers,
    infoWindows,
    polylines
  };
};
