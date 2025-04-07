
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
  
  // 네이버 맵스 스크립트 로드
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

  // 지도 초기화
  useEffect(() => {
    if (isNaverLoaded) {
      initializeJejuMap();
    }
  }, [isNaverLoaded]);

  // 마커 클리어 함수 - null 체크 추가
  const clearMarkersAndInfoWindows = () => {
    // 마커 제거
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
    
    // 정보창 닫기
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
    
    // 폴리라인 제거
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

  // 지도 초기화 함수
  const initializeJejuMap = () => {
    if (!mapContainer.current || !window.naver || !window.naver.maps) {
      console.error("Cannot initialize Jeju map");
      return;
    }
    
    try {
      // 지도 옵션 설정
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

      // 지도 생성
      map.current = new window.naver.maps.Map(mapContainer.current, options);
      
      // 지도가 로드된 후 이벤트 처리
      window.naver.maps.Event.once(map.current, 'init', function() {
        console.log("Jeju map initialized");
        setIsMapInitialized(true);
        
        // 제주도 경계선 그리기
        drawJejuBoundary();
        
        // 주요 명소 마커 추가
        addJejuLandmarks();
        
        toast.success("제주도 지도가 로드되었습니다");
      });
      
      // 지도 이벤트 리스너
      window.naver.maps.Event.addListener(map.current, 'zoom_changed', (zoom: number) => {
        console.log('Zoom changed to:', zoom);
        
        // 줌 레벨에 따라 UI 조정 가능
        if (zoom < 9) {
          setShowInfoPanel(true);
        }
      });
      
    } catch (error) {
      console.error("Failed to initialize Jeju map:", error);
      setIsMapError(true);
    }
  };

  // 제주도 경계선 그리기
  const drawJejuBoundary = () => {
    if (!map.current || !window.naver) return;
    
    try {
      // 제주도 경계선 좌표 변환
      const jejuBoundaryPath = JEJU_BOUNDARY.map(coord => 
        new window.naver.maps.LatLng(coord.lat, coord.lng)
      );
      
      // 제주도 해안선 다각형 그리기
      const polygon = new window.naver.maps.Polygon({
        map: map.current,
        paths: jejuBoundaryPath,
        strokeWeight: 3,
        strokeColor: '#5EAEFF',
        strokeOpacity: 0.8,
        fillColor: '#6CCEA0',
        fillOpacity: 0.2
      });
      
      // 제주도 라벨
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

  // 제주도 주요 명소 마커 추가
  const addJejuLandmarks = () => {
    if (!map.current || !window.naver) return;
    
    try {
      JEJU_LANDMARKS.forEach((landmark, index) => {
        // 마커 위치
        const position = new window.naver.maps.LatLng(landmark.lat, landmark.lng);
        
        // 마커 아이콘
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
        
        // 마커 생성
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map.current,
          title: landmark.name,
          icon: markerIcon,
          zIndex: 100
        });
        
        // 정보창 내용
        const contentString = `
          <div style="padding: 15px; border-radius: 8px; max-width: 250px;">
            <h3 style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${landmark.name}</h3>
            <p style="font-size: 13px; color: #555; margin-bottom: 10px;">${landmark.description}</p>
          </div>
        `;
        
        // 정보창 생성
        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentString,
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: "white",
          borderColor: "#ddd",
          pixelOffset: new window.naver.maps.Point(0, -5)
        });
        
        // 마커 클릭 이벤트
        window.naver.maps.Event.addListener(marker, 'click', () => {
          // 기존 열린 정보창 닫기
          infoWindows.current.forEach(iw => iw.close());
          
          // 이 정보창 열기
          infoWindow.open(map.current, marker);
          
          // 액티브 마커 설정
          setActiveMarker(landmark.name);
        });
        
        markers.current.push(marker);
        infoWindows.current.push(infoWindow);
      });
    } catch (error) {
      console.error("Error adding Jeju landmarks:", error);
    }
  };

  // 특정 위치로 이동
  const moveToLocation = (lat: number, lng: number, name: string) => {
    if (!map.current || !window.naver) return;
    
    const position = new window.naver.maps.LatLng(lat, lng);
    
    // 지도 중심 이동 및 줌
    map.current.setCenter(position);
    map.current.setZoom(14);
    
    // 해당 이름의 마커 찾아서 정보창 표시
    const markerIndex = JEJU_LANDMARKS.findIndex(lm => lm.name === name);
    if (markerIndex >= 0 && markers.current[markerIndex + 1]) {
      // 기존 열린 정보창 닫기
      infoWindows.current.forEach(iw => iw.close());
      
      // 해당 마커의 정보창 열기
      infoWindows.current[markerIndex].open(map.current, markers.current[markerIndex + 1]);
    }
  };

  // 로딩 또는 에러 상태 표시
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
      {/* 지도 컨테이너 */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-lg overflow-hidden bg-blue-50" 
      />
      
      {/* 로딩 표시 */}
      {!isMapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">제주도 지도를 초기화하는 중...</p>
          </div>
        </div>
      )}
      
      {/* 정보 패널 */}
      {showInfoPanel && isMapInitialized && (
        <JejuInfoPanel onSelectLocation={moveToLocation} />
      )}
      
      {/* 지도 타입 컨트롤 */}
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
      
      {/* 패널 토글 버튼 */}
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
