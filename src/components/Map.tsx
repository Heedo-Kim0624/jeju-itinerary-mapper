import React, { useEffect, useRef, useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import { toast } from "sonner";
import { getCategoryColor } from '@/utils/categoryColors';

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

  const initializeMap = () => {
    if (!mapContainer.current || !isKakaoLoaded) return;
    if (map.current) return;

    try {
      const options = {
        center: new window.kakao.maps.LatLng(33.3846216, 126.5311884),
        level: 9
      };

      map.current = new window.kakao.maps.Map(mapContainer.current, options);
      
      const zoomControl = new window.kakao.maps.ZoomControl();
      map.current.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
      
      const mapTypeControl = new window.kakao.maps.MapTypeControl();
      map.current.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);

      setIsMapInitialized(true);
      toast.success("지도가 로드되었습니다");
      
      drawJejuBoundary();
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error("지도 로드에 실패했습니다");
    }
  };

  const drawJejuBoundary = () => {
    if (!map.current) return;
    
    const jejuBoundaryPath = [
      new window.kakao.maps.LatLng(33.10, 126.15),
      new window.kakao.maps.LatLng(33.10, 126.95),
      new window.kakao.maps.LatLng(33.60, 126.95),
      new window.kakao.maps.LatLng(33.60, 126.15),
      new window.kakao.maps.LatLng(33.10, 126.15)
    ];
    
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

  useEffect(() => {
    loadKakaoMapScript();
  }, []);

  useEffect(() => {
    if (isKakaoLoaded) {
      initializeMap();
    }
  }, [isKakaoLoaded]);

  const clearMarkers = () => {
    markers.current.forEach(marker => {
      marker.setMap(null);
    });
    markers.current = [];
  };

  const clearPolylines = () => {
    polylines.current.forEach(polyline => {
      polyline.setMap(null);
    });
    polylines.current = [];
  };

  const addMarkers = (placesToMark: Place[], isItinerary: boolean = false) => {
    if (!map.current || !isMapInitialized) return;
    
    clearMarkers();
    
    const bounds = new window.kakao.maps.LatLngBounds();
    
    placesToMark.forEach((place, index) => {
      if (typeof place.x !== 'number' || typeof place.y !== 'number') return;
      
      const position = new window.kakao.maps.LatLng(place.y, place.x);
      bounds.extend(position);
      
      const markerColor = getCategoryColor(place.category);
      
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
        content.textContent = (index + 1).toString();
      } else {
        content.textContent = place.category.charAt(0).toUpperCase();
      }
      
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        yAnchor: 1
      });
      
      customOverlay.setMap(map.current);
      markers.current.push(customOverlay);
      
      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div class="font-medium px-2 py-1">${place.name}</div>`,
        removable: false
      });
      
      window.kakao.maps.event.addListener(customOverlay, 'click', function() {
        infowindow.open(map.current, position);
      });
    });
    
    if (placesToMark.length > 0) {
      map.current.setBounds(bounds, 60);
    }
  };

  const drawRoute = (routePlaces: Place[]) => {
    if (!map.current || !isMapInitialized || routePlaces.length <= 1) return;
    
    clearPolylines();
    
    const linePath = routePlaces.map(place => 
      new window.kakao.maps.LatLng(place.y, place.x)
    );
    
    const polyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 3,
      strokeColor: '#5EAEFF',
      strokeOpacity: 0.8,
      strokeStyle: 'dashed'
    });
    
    polyline.setMap(map.current);
    polylines.current.push(polyline);
  };

  useEffect(() => {
    if (!isMapInitialized || !isKakaoLoaded) return;
    
    if (itinerary && selectedDay !== null) {
      const dayPlaces = itinerary.find(day => day.day === selectedDay)?.places || [];
      if (dayPlaces.length > 0) {
        addMarkers(dayPlaces, true);
        
        if (dayPlaces.length > 1) {
          drawRoute(dayPlaces);
        }
      }
    } else if (selectedPlace) {
      addMarkers([selectedPlace]);
    } else if (places.length > 0) {
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
