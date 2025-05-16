
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
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [isLoadingScript, setIsLoadingScript] = useState<boolean>(false);
  const mapInitializedRef = useRef<boolean>(false); // Reference to track initialization

  useEffect(() => {
    const initNaverMaps = async () => {
      // 이미 로드 중이거나 로드 완료된 경우 중복 실행 방지
      if (isNaverLoaded || isLoadingScript) return;
      
      // 최대 로드 시도 횟수 초과시 에러 처리
      if (loadAttempts >= 3) {
        console.error("Maximum load attempts reached for Jeju map");
        setIsMapError(true);
        toast.error("지도 로드에 실패했습니다.");
        return;
      }
      
      setIsLoadingScript(true);
      
      try {
        console.log(`제주 지도 API 로드 시도 (${loadAttempts + 1}/3)`);
        await loadNaverMaps();
        
        // naver와 naver.maps 객체가 제대로 로드되었는지 확인
        if (!window.naver || !window.naver.maps) {
          throw new Error("Naver maps object not available after script load");
        }
        
        setIsNaverLoaded(true);
        console.log("Naver Maps loaded successfully for Jeju visualization");
      } catch (error) {
        console.error("Failed to load Naver Maps:", error);
        setIsMapError(true);
        
        // 3초 후 재시도
        setTimeout(() => {
          setLoadAttempts(prev => prev + 1);
          setIsMapError(false);
        }, 3000);
      } finally {
        setIsLoadingScript(false);
      }
    };
    
    if (!isNaverLoaded && !isMapError && !isLoadingScript) {
      initNaverMaps();
    }
    
    return () => {
      clearMarkersAndInfoWindows();
    };
  }, [loadAttempts, isNaverLoaded, isMapError, isLoadingScript]);

  useEffect(() => {
    // Prevent duplicate initialization
    if (!isNaverLoaded || !mapContainer.current || mapInitializedRef.current) return;
    
    let initTimeout: number;
    
    try {
      console.log("Initializing Jeju map - API is loaded, container exists");
      
      // 지도 컨테이너 크기 확인 및 보정
      if (mapContainer.current.clientWidth === 0 || mapContainer.current.clientHeight === 0) {
        console.warn("Map container dimensions are zero, setting minimum size");
        mapContainer.current.style.minWidth = "100px";
        mapContainer.current.style.minHeight = "100px";
      }
      
      if (!window.naver || !window.naver.maps) {
        throw new Error("Naver maps API not available");
      }
      
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

      console.log("Creating Jeju Map instance");
      map.current = new window.naver.maps.Map(mapContainer.current, options);
      mapInitializedRef.current = true; // Mark as initialized in ref
      
      // 백업 타이머 설정: 5초 후에도 init_stylemap 이벤트가 발생하지 않으면 강제로 초기화 완료 처리
      initTimeout = window.setTimeout(() => {
        if (!isMapInitialized) {
          console.log("Jeju map initialization timeout - setting as initialized anyway");
          setIsMapInitialized(true);
          toast.success("제주도 지도가 로드되었습니다");
        }
      }, 5000);
      
      // 이벤트 리스너로 초기화 완료 감지
      if (window.naver.maps.Event) {
        window.naver.maps.Event.once(map.current, 'init_stylemap', function() {
          window.clearTimeout(initTimeout);
          console.log("Jeju map initialized through event");
          setIsMapInitialized(true);
          toast.success("제주도 지도가 로드되었습니다");
        });
      
        window.naver.maps.Event.addListener(map.current, 'zoom_changed', (zoom: number) => {
          console.log('Zoom changed to:', zoom);
          
          if (zoom < 9) {
            setShowInfoPanel(true);
          }
        });
      }
      
    } catch (error) {
      console.error("Failed to initialize Jeju map:", error);
      setIsMapError(true);
      mapInitializedRef.current = false; // Reset initialization flag on error
      toast.error("제주도 지도 초기화에 실패했습니다");
    }

    return () => {
      if (initTimeout) {
        window.clearTimeout(initTimeout);
      }
    };
  }, [isNaverLoaded, isMapInitialized]);

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
