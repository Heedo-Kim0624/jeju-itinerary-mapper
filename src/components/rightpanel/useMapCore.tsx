
import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from "sonner";
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { getCategoryColor } from '@/utils/categoryColors';
import { Place } from '@/types/supabase';

// Jeju Island center coordinates
const JEJU_CENTER = { lat: 33.3617, lng: 126.5292 };

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
        console.log("Loading Naver Maps...");
        await loadNaverMaps();
        setIsNaverLoaded(true);
        console.log("Naver Maps loaded successfully");
      } catch (error) {
        console.error("Failed to load Naver Maps:", error);
        setIsMapError(true);
        toast.error("지도 로드에 실패했습니다");
      }
    };
    
    initNaverMaps();
    
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        clearMarkersAndUiElements();
      }
    };
  }, []);

  useEffect(() => {
    if (isNaverLoaded) {
      initializeMap();
    }
  }, [isNaverLoaded]);

  useEffect(() => {
    if (isMapError && loadAttempts < 3) {
      console.log("Map error detected, retrying...");
      const timer = setTimeout(() => {
        setIsMapError(false);
        setLoadAttempts(prev => prev + 1);
        loadNaverMaps().then(() => setIsNaverLoaded(true)).catch(() => setIsMapError(true));
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isMapError, loadAttempts]);

  useEffect(() => {
    const handleResize = () => {
      if (map.current && mapContainer.current && window.naver) {
        console.log("Window resized, triggering map resize");
        window.naver.maps.Event.trigger(map.current, 'resize');
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapContainer.current || !window.naver || !window.naver.maps) {
      console.error("Cannot initialize map - container or naver maps not available");
      console.log("Map container size:", mapContainer.current?.offsetWidth, mapContainer.current?.offsetHeight);
      return;
    }

    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        zoom: 10,
        minZoom: 9,
        maxZoom: 18,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT
        }
      };

      map.current = new window.naver.maps.Map(mapContainer.current, mapOptions);
      setIsMapInitialized(true);

      window.naver.maps.Event.once(map.current, 'init', () => {
        console.log("Naver Map initialized");
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다.");
    }
  }, []);

  const clearMarkersAndUiElements = useCallback(() => {
    clearMarkers();
    clearInfoWindows();
    clearPolylines();
  }, []);

  const clearMarkers = useCallback(() => {
    if (markers.current && markers.current.length > 0) {
      markers.current.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          try {
            marker.setMap(null);
          } catch (error) {
            console.error("Error clearing marker:", error);
          }
        }
      });
    }
    markers.current = [];
  }, []);

  const clearInfoWindows = useCallback(() => {
    if (infoWindows.current && infoWindows.current.length > 0) {
      infoWindows.current.forEach(infoWindow => {
        if (infoWindow && typeof infoWindow.close === 'function') {
          try {
            infoWindow.close();
          } catch (error) {
            console.error("Error closing infoWindow:", error);
          }
        }
      });
    }
    infoWindows.current = [];
  }, []);

  const clearPolylines = useCallback(() => {
    if (polylines.current && polylines.current.length > 0) {
      polylines.current.forEach(polyline => {
        if (polyline && typeof polyline.setMap === 'function') {
          try {
            polyline.setMap(null);
          } catch (error) {
            console.error("Error clearing polyline:", error);
          }
        }
      });
    }
    polylines.current = [];
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

  const addMarkers = useCallback((placesToMark: Place[], isItinerary: boolean = false) => {
    if (!map.current || !isMapInitialized || !window.naver) return;
    
    clearMarkersAndUiElements();
    
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
        
        const markerColor = getCategoryColor(place.category);
        
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
    toggleGeoJsonVisibility
  };
};
