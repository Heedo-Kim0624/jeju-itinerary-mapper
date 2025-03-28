
import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from "sonner";

// Define interfaces for the component
interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

interface Place {
  id: string;
  name: string;
  x: number;
  y: number;
  category: string;
}

interface ItineraryDay {
  day: number;
  places: Place[];
}

// OpenStreet Map 노드 데이터 인터페이스 (나중에 실제 데이터 형식에 맞게 수정 필요)
interface OSMNode {
  id: string;
  x: number;
  y: number;
}

interface OSMLink {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  turnType?: string;
}

declare global {
  interface Window {
    kakao: any;
  }
}

const Map: React.FC<MapProps> = ({ places, selectedPlace, itinerary, selectedDay }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isKakaoLoaded, setIsKakaoLoaded] = useState<boolean>(false);

  // 카카오맵 스크립트 로드 함수
  const loadKakaoMapScript = () => {
    if (window.kakao && window.kakao.maps) {
      setIsKakaoLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=de034d4cccad63e1be77a7dd6910b730&autoload=false`;
    script.onload = () => {
      window.kakao.maps.load(() => {
        setIsKakaoLoaded(true);
      });
    };
    document.head.appendChild(script);
  };

  // 카카오맵 초기화
  const initializeMap = () => {
    if (!mapContainer.current || !isKakaoLoaded) return;
    if (map.current) return;

    try {
      const options = {
        center: new window.kakao.maps.LatLng(33.3846216, 126.5311884), // 제주도 중심 좌표
        level: 9 // 지도 확대 레벨
      };

      map.current = new window.kakao.maps.Map(mapContainer.current, options);
      
      // 지도 컨트롤 추가
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      // 지도 타입 컨트롤 추가
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      map.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

      setIsMapInitialized(true);
      toast.success("지도가 로드되었습니다");
      
      // OpenStreetMap 데이터 레이어 추가 (여기서는 제주도 경계를 간단히 표시) 
      // 실제 OSM 데이터는 이후에 적용해야 함
      // TODO: OpenStreetMap의 node, link, turntype 데이터를 레이어로 추가하는 로직 구현 필요
      drawJejuBoundary();
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error("지도 로드에 실패했습니다");
    }
  };

  // 제주도 경계선 그리기 (임시)
  const drawJejuBoundary = () => {
    if (!map.current) return;
    
    // 제주도 경계 좌표 (간략화)
    const jejuBoundaryPath = [
      new window.kakao.maps.LatLng(33.10, 126.15),
      new window.kakao.maps.LatLng(33.10, 126.95),
      new window.kakao.maps.LatLng(33.60, 126.95),
      new window.kakao.maps.LatLng(33.60, 126.15),
      new window.kakao.maps.LatLng(33.10, 126.15)
    ];
    
    // 경계선 폴리곤 생성
    const polygon = new window.kakao.maps.Polygon({
      path: jejuBoundaryPath,
      strokeWeight: 2,
      strokeColor: '#5EAEFF',
      strokeOpacity: 0.7,
      strokeStyle: 'solid',
      fillColor: '#6CCEA0',
      fillOpacity: 0.1
    });
    
    polygon.setMap(map.current);
  };

  // 카카오맵 스크립트 로드
  useEffect(() => {
    loadKakaoMapScript();
  }, []);

  // 카카오맵 초기화
  useEffect(() => {
    if (isKakaoLoaded) {
      initializeMap();
    }
  }, [isKakaoLoaded]);

  // 마커 삭제
  const clearMarkers = () => {
    markers.current.forEach(marker => {
      marker.setMap(null);
    });
    markers.current = [];
  };

  // 경로선 삭제
  const clearPolylines = () => {
    polylines.current.forEach(polyline => {
      polyline.setMap(null);
    });
    polylines.current = [];
  };

  // 마커 추가
  const addMarkers = (placesToMark: Place[], isItinerary: boolean = false) => {
    if (!map.current || !isMapInitialized) return;
    
    clearMarkers();
    
    // 모든 마커들의 위치를 포함할 경계
    const bounds = new window.kakao.maps.LatLngBounds();
    
    placesToMark.forEach((place, index) => {
      // 좌표가 없으면 건너뛰기
      if (typeof place.x !== 'number' || typeof place.y !== 'number') return;
      
      // 마커 위치 설정
      const position = new window.kakao.maps.LatLng(place.y, place.x);
      bounds.extend(position);
      
      // 마커 이미지 설정
      let markerColor;
      if (isItinerary) {
        // 일정에서는 순서 번호로 마커 표시
        markerColor = '#5EAEFF';
      } else {
        // 카테고리별 색상
        switch (place.category) {
          case 'restaurant':
            markerColor = '#FF8C3E';
            break;
          case 'cafe':
            markerColor = '#6CCEA0';
            break;
          case 'attraction':
            markerColor = '#5EAEFF';
            break;
          case 'accommodation':
            markerColor = '#9B87F5';
            break;
          default:
            markerColor = '#1F1F1F';
        }
      }
      
      // 커스텀 오버레이 콘텐츠
      const content = document.createElement('div');
      content.className = 'custom-marker animate-fade-in';
      content.style.width = '30px';
      content.style.height = '30px';
      content.style.borderRadius = '50%';
      content.style.display = 'flex';
      content.style.alignItems = 'center';
      content.style.justifyContent = 'center';
      content.style.fontSize = '14px';
      content.style.fontWeight = 'bold';
      content.style.color = 'white';
      content.style.backgroundColor = markerColor;
      content.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      
      if (isItinerary) {
        // 일정에서는 순서 번호
        content.textContent = (index + 1).toString();
      } else {
        // 카테고리의 첫 글자
        content.textContent = place.category.charAt(0).toUpperCase();
      }
      
      // 커스텀 오버레이 생성
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });
      
      customOverlay.setMap(map.current);
      markers.current.push(customOverlay);
      
      // 인포윈도우 생성
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div class="font-medium px-2 py-1">${place.name}</div>`,
        removable: false
      });
      
      // 마커 클릭 이벤트
      window.kakao.maps.event.addListener(customOverlay, 'click', function() {
        infowindow.open(map.current, position);
      });
    });
    
    // 지도 범위 재설정
    if (placesToMark.length > 0) {
      map.current.setBounds(bounds, 60);
    }
  };
  
  // 경로 그리기
  const drawRoute = (routePlaces: Place[]) => {
    if (!map.current || !isMapInitialized || routePlaces.length <= 1) return;
    
    clearPolylines();
    
    // 경로 좌표 배열
    const linePath = routePlaces.map(place => 
      new window.kakao.maps.LatLng(place.y, place.x)
    );
    
    // 경로선 생성
    const polyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 3,
      strokeColor: '#5EAEFF',
      strokeOpacity: 0.8,
      strokeStyle: 'dashed'
    });
    
    polyline.setMap(map.current);
    polylines.current.push(polyline);
    
    // TODO: 실제 OSM link 데이터를 활용한 경로 표시 로직 구현 필요
    // OSM 데이터를 받아온 후, 경로 생성 알고리즘을 적용하여 실제 도로 기반 경로 표시
  };
  
  // 장소 업데이트시 마커 표시
  useEffect(() => {
    // 맵이 초기화되었고 카카오맵 API가 로드된 경우에만 실행
    if (!isMapInitialized || !isKakaoLoaded) return;
    
    // 일정이 있고 특정 일자가 선택된 경우
    if (itinerary && selectedDay !== null) {
      const dayPlaces = itinerary.find(day => day.day === selectedDay)?.places || [];
      if (dayPlaces.length > 0) {
        addMarkers(dayPlaces, true);
        
        // 경로 그리기
        if (dayPlaces.length > 1) {
          drawRoute(dayPlaces);
        }
      }
    } else if (selectedPlace) {
      // 단일 장소 선택
      addMarkers([selectedPlace]);
    } else if (places.length > 0) {
      // 모든 장소 표시
      addMarkers(places);
    }
  }, [places, selectedPlace, itinerary, selectedDay, isMapInitialized, isKakaoLoaded]);

  if (!isKakaoLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-jeju-light-gray rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4">지도를 불러오는 중...</h3>
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
          카카오맵 API를 불러오는 중입니다. 잠시만 기다려주세요.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-md z-10 text-sm">
        <p className="font-medium text-jeju-black">제주도 여행 계획</p>
      </div>
    </div>
  );
};

export default Map;
