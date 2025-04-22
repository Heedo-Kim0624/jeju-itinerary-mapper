import { useState, useRef, useEffect, useCallback } from 'react';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { getCategoryColor } from '@/utils/categoryColors';
import { Place } from '@/types/supabase';
import { initializeNaverMap, JEJU_CENTER } from '@/utils/map/mapInitializer';
import { clearMarkers, clearInfoWindows, clearPolylines } from '@/utils/map/mapCleanup';
import { useMapResize } from '@/hooks/useMapResize';

export const useMapCore = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindows = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [showGeoJson, setShowGeoJson] = useState<boolean>(false);

  useEffect(() => {
    const initNaverMaps = async () => {
      try {
        await loadNaverMaps();
        setIsNaverLoaded(true);
      } catch (error) {
        setIsMapError(true);
      }
    };
    
    initNaverMaps();
    
    return () => {
      if (map.current) {
        clearMarkersAndUiElements();
      }
    };
  }, []);

  useEffect(() => {
    if (isNaverLoaded) {
      const newMap = initializeNaverMap(mapContainer.current);
      if (newMap) {
        map.current = newMap;
        setIsMapInitialized(true);
      }
    }
  }, [isNaverLoaded]);

  useEffect(() => {
    if (isMapError && loadAttempts < 3) {
      const timer = setTimeout(() => {
        setIsMapError(false);
        setLoadAttempts(prev => prev + 1);
        loadNaverMaps().then(() => setIsNaverLoaded(true)).catch(() => setIsMapError(true));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isMapError, loadAttempts]);

  useMapResize(map.current);

  const clearMarkersAndUiElements = useCallback(() => {
    markers.current = clearMarkers(markers.current);
    infoWindows.current = clearInfoWindows(infoWindows.current);
    polylines.current = clearPolylines(polylines.current);
  }, []);

  const createInfoWindowContent = useCallback((place: Place) => {
    return `
      <div style="padding: 5px; text-align: center;">
        <h6 style="margin:0; font-weight: bold;">${place.name}</h6>
        <small>${place.category}</small>
      </div>
    `;
  }, []);

  const calculateRoutes = useCallback((placesToRoute: Place[]) => {
    if (!map.current || !isMapInitialized || !window.naver || placesToRoute.length < 2) return;
    
    clearPolylines();
    
    const path = placesToRoute.map(place => new window.naver.maps.LatLng(place.y, place.x));
    
    const polyline = new window.naver.maps.Polyline({
      map: map.current,
      path: path,
      strokeColor: '#22c55e',
      strokeOpacity: 0.7,
      strokeWeight: 5
    });
    
    polylines.current.push(polyline);
  }, [isMapInitialized, clearPolylines]);

  const addMarkers = useCallback((
    placesToMark: Place[], 
    opts?: { highlight?: boolean; isItinerary?: boolean }
  ) => {
    if (!map.current || !isMapInitialized || !window.naver) return;
    
    clearMarkersAndUiElements();
    
    const isItinerary = opts?.isItinerary || false;
    const highlight = opts?.highlight || false;
    
    console.log(`Adding ${placesToMark.length} markers, isItinerary:`, isItinerary);
    
    try {
      const bounds = new window.naver.maps.LatLngBounds();
      
      placesToMark.forEach((place, index) => {
        if (typeof place.x !== 'number' || typeof place.y !== 'number') {
          console.warn("Invalid coordinates for place:", place);
          return;
        }
        
        const position = new window.naver.maps.LatLng(place.y, place.x);
        bounds.extend(position);
        
        const markerColor = highlight 
          ? '#FF0000' // 하이라이트된 마커는 빨간색
          : getCategoryColor(place.category);
        
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map.current,
          title: place.name,
          icon: {
            content: `<div style="width: 24px; height: 24px; background-color: ${markerColor}; 
                     border-radius: 50%; display: flex; justify-content: center; align-items: center;
                     color: white; font-size: 12px; border: 2px solid white;">${isItinerary ? (index + 1) : ''}</div>`,
            size: new window.naver.maps.Size(24, 24),
            anchor: new window.naver.maps.Point(12, 12)
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
          infoWindow.open(map.current, marker);
        });
      });
      
      if (placesToMark.length > 0) {
        map.current.fitBounds(bounds, {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50
        });
      }
    } catch (error) {
      console.error("Error adding markers:", error);
    }
  }, [isMapInitialized, clearMarkersAndUiElements, createInfoWindowContent]);

  const panTo = useCallback((locationOrCoords: string | {lat: number, lng: number}) => {
    if (!map.current || !isMapInitialized) return;
    
    try {
      let coords;
      
      if (typeof locationOrCoords === 'string') {
        const locationMap: Record<string, {lat: number, lng: number}> = {
          '서귀포': {lat: 33.2542, lng: 126.5581},
          '제주': {lat: 33.4996, lng: 126.5312},
          '애월': {lat: 33.4630, lng: 126.3319},
          '조천': {lat: 33.5382, lng: 126.6435},
        };
        
        coords = locationMap[locationOrCoords] || JEJU_CENTER;
      } else {
        coords = locationOrCoords;
      }
      
      map.current.setCenter(new window.naver.maps.LatLng(coords.lat, coords.lng));
      map.current.setZoom(12);
    } catch (error) {
      console.error("Error panning map to location:", error);
    }
  }, [isMapInitialized]);

  const toggleGeoJsonVisibility = useCallback(() => {
    setShowGeoJson(!showGeoJson);
  }, [showGeoJson]);

  return {
    mapContainer,
    map: map.current,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    addMarkers,
    calculateRoutes,
    clearMarkersAndUiElements,
    showGeoJson,
    toggleGeoJsonVisibility,
    panTo
  };
};

export default useMapCore;
