import React, { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { JEJU_CENTER, JEJU_BOUNDARY, JEJU_LANDMARKS, createMarkerIcon, createLabelIcon } from '@/utils/jejuMapStyles';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
import JejuInfoPanel from './JejuInfoPanel';

interface JejuVisualizerProps {
  className?: string;
}

const JejuVisualizer: React.FC<JejuVisualizerProps> = ({ className }) => {
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
        
        drawJejuBoundary();
        
        addJejuLandmarks();
        
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

  const drawJejuBoundary = () => {
    if (!map.current || !window.naver) return;
    
    try {
      const jejuBoundaryPath = JEJU_BOUNDARY.map(coord => 
        new window.naver.maps.LatLng(coord.lat, coord.lng)
      );
      
      const polygon = new window.naver.maps.Polygon({
        map: map.current,
        paths: jejuBoundaryPath,
        strokeWeight: 3,
        strokeColor: '#5EAEFF',
        strokeOpacity: 0.8,
        fillColor: '#6CCEA0',
        fillOpacity: 0.2
      });
      
      const jejuLabel = new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        map: map.current,
        icon: createLabelIcon('제주도'),
        clickable: false
      });
      
      markers.current.push(jejuLabel);
    } catch (error) {
      console.error("Error drawing Jeju boundary:", error);
    }
  };

  const addJejuLandmarks = () => {
    if (!map.current || !window.naver) return;
    
    try {
      JEJU_LANDMARKS.forEach((landmark, index) => {
        const position = new window.naver.maps.LatLng(landmark.lat, landmark.lng);
        
        const markerIcon = {
          content: `
            <div class="custom-marker" style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background-color: #FF7043;
              color: white;
              font-weight: bold;
              display: flex;
              align-items: center;
              justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.3);
              border: 2px solid white;
              font-size: 14px;
            ">${index + 1}</div>
          `,
          size: new window.naver.maps.Size(36, 36),
          anchor: new window.naver.maps.Point(18, 18)
        };
        
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map.current,
          title: landmark.name,
          icon: markerIcon,
          zIndex: 100
        });
        
        const contentString = `
          <div style="padding: 15px; border-radius: 8px; max-width: 250px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${landmark.name}</h3>
            <p style="font-size: 13px; color: #555; margin-bottom: 10px;">${landmark.description}</p>
          </div>
        `;
        
        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentString,
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: "white",
          borderColor: "#ddd",
          pixelOffset: new window.naver.maps.Point(0, -5)
        });
        
        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindows.current.forEach(iw => iw.close());
          infoWindow.open(map.current, marker);
          setActiveMarker(landmark.name);
        });
        
        markers.current.push(marker);
        infoWindows.current.push(infoWindow);
      });
    } catch (error) {
      console.error("Error adding Jeju landmarks:", error);
    }
  };

  const moveToLocation = (lat: number, lng: number, name: string) => {
    if (!map.current || !window.naver) return;
    
    const position = new window.naver.maps.LatLng(lat, lng);
    
    map.current.setCenter(position);
    map.current.setZoom(14);
    
    const markerIndex = JEJU_LANDMARKS.findIndex(lm => lm.name === name);
    if (markerIndex >= 0 && markers.current[markerIndex + 1]) {
      infoWindows.current.forEach(iw => iw.close());
      infoWindows.current[markerIndex].open(map.current, markers.current[markerIndex + 1]);
    }
  };

  if (!isNaverLoaded || isMapError) {
    return (
      <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6 ${className}`}>
        <h3 className="text-xl font-medium mb-4">
          {isMapError ? "지도 로드 오류" : "제주도 지도를 불러오는 중..."}
        </h3>
        
        <div className="flex items-center justify-center mb-4">
          {isMapError ? (
            <div className="h-8 w-8 text-red-500 animate-pulse">⚠️</div>
          ) : (
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
          {isMapError 
            ? "네이버 지도 로드 중 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요." 
            : "네이버 지도 API를 불러오는 중입니다. 잠시만 기다려주세요."
          }
        </p>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-lg overflow-hidden bg-blue-50" 
      />
      
      {!isMapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">제주도 지도를 초기화하는 중...</p>
          </div>
        </div>
      )}
      
      {showInfoPanel && isMapInitialized && (
        <JejuInfoPanel onSelectLocation={moveToLocation} />
      )}
      
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-md overflow-hidden">
          {window.naver && window.naver.maps ? (
            <>
              <button 
                className="px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors" 
                onClick={() => map.current?.setMapTypeId(window.naver.maps.MapTypeId.NORMAL)}
              >
                일반
              </button>
              <button 
                className="px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors" 
                onClick={() => map.current?.setMapTypeId(window.naver.maps.MapTypeId.TERRAIN)}
              >
                지형
              </button>
              <button 
                className="px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors" 
                onClick={() => map.current?.setMapTypeId(window.naver.maps.MapTypeId.SATELLITE)}
              >
                위성
              </button>
              <button 
                className="px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors" 
                onClick={() => map.current?.setMapTypeId(window.naver.maps.MapTypeId.HYBRID)}
              >
                하이브리드
              </button>
            </>
          ) : (
            <div className="px-3 py-1.5 text-sm text-gray-400">지도 로딩 중...</div>
          )}
        </div>
      </div>
      
      <button 
        className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-md z-10 text-sm hover:bg-blue-50 transition-colors"
        onClick={() => setShowInfoPanel(!showInfoPanel)}
      >
        {showInfoPanel ? '정보 패널 숨기기' : '정보 패널 보기'}
      </button>
    </div>
  );
};

export default JejuVisualizer;
