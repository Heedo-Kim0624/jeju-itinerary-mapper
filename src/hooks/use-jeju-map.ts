
import { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import { JEJU_CENTER } from '@/utils/jejuMapStyles';

export const useJejuMap = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const infoWindows = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [showInfoPanel, setShowInfoPanel] = useState<boolean>(true);

  useEffect(() => {
    const initNaverMaps = async () => {
      try {
        await loadNaverMaps();
        setIsNaverLoaded(true);
        console.log("Naver Maps loaded successfully for Jeju visualization");
      } catch (error) {
        console.error("Failed to load Naver Maps:", error);
        setIsMapError(true);
        toast.error("지도 로드에 실패했습니다.");
      }
    };
    
    initNaverMaps();
    
    return () => {
      clearMarkersAndInfoWindows();
    };
  }, []);

  useEffect(() => {
    if (isNaverLoaded) {
      initializeJejuMap();
    }
  }, [isNaverLoaded]);

  const clearMarkersAndInfoWindows = () => {
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
  };

  const initializeJejuMap = () => {
    if (!mapContainer.current || !window.naver || !window.naver.maps) {
      console.error("Cannot initialize Jeju map");
      return;
    }
    
    try {
      const options = {
        center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        zoom: 10,
        minZoom: 8,
        maxZoom: 18,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT
        },
        mapTypeControl: true,
        scaleControl: true,
        mapTypeId: window.naver.maps.MapTypeId.TERRAIN
      };

      map.current = new window.naver.maps.Map(mapContainer.current, options);
      
      window.naver.maps.Event.once(map.current, 'init', function() {
        console.log("Jeju map initialized");
        setIsMapInitialized(true);
        toast.success("제주도 지도가 로드되었습니다");
      });
      
      window.naver.maps.Event.addListener(map.current, 'zoom_changed', (zoom: number) => {
        console.log('Zoom changed to:', zoom);
        
        if (zoom < 9) {
          setShowInfoPanel(true);
        }
      });
      
    } catch (error) {
      console.error("Failed to initialize Jeju map:", error);
      setIsMapError(true);
    }
  };

  return {
    map: map.current,
    mapContainer,
    markers,
    polylines,
    infoWindows,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    activeMarker,
    setActiveMarker,
    showInfoPanel,
    setShowInfoPanel,
    clearMarkersAndInfoWindows
  };
};
