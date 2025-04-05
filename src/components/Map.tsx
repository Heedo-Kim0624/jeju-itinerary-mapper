
import React, { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { getCategoryColor } from '@/utils/categoryColors';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import { MapPin, Star, Clock, ExternalLink, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

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
  address?: string;
  operatingHours?: string;
  rating?: number;
  reviewCount?: number;
  naverLink?: string;
  instaLink?: string;
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
    naver: any;
  }
}

const NAVER_CLIENT_ID = "w2r5am4bmr"; // 네이버 API Client ID

// 제주도 중심 좌표
const JEJU_CENTER = { lat: 33.3846216, lng: 126.5311884 };
// 제주도 경계 좌표 (정확한 해안선 형태를 위한 상세 좌표)
const JEJU_BOUNDARY = [
  { lat: 33.5427, lng: 126.5426 }, // 제주시
  { lat: 33.4996, lng: 126.5312 }, // 조천읍
  { lat: 33.4841, lng: 126.4831 }, // 애월읍
  { lat: 33.4567, lng: 126.3387 }, // 한림읍
  { lat: 33.3936, lng: 126.2422 }, // 한경면
  { lat: 33.2905, lng: 126.1638 }, // 대정읍
  { lat: 33.2500, lng: 126.2853 }, // 안덕면
  { lat: 33.2482, lng: 126.4155 }, // 중문
  { lat: 33.2439, lng: 126.5631 }, // 서귀포시
  { lat: 33.2510, lng: 126.6224 }, // 남원읍
  { lat: 33.3183, lng: 126.7446 }, // 표선면
  { lat: 33.3825, lng: 126.8284 }, // 성산읍
  { lat: 33.4943, lng: 126.8369 }, // 구좌읍
  { lat: 33.5427, lng: 126.6597 }, // 우도면
  { lat: 33.5427, lng: 126.5426 }  // 다시 제주시 (폐곡선을 위해)
];

const Map: React.FC<MapProps> = ({ places, selectedPlace, itinerary, selectedDay }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);
  const [loadAttempts, setLoadAttempts] = useState<number>(0);
  const [popupPlace, setPopupPlace] = useState<Place | null>(null);
  const [showDialog, setShowDialog] = useState<boolean>(false);

  const loadNaverMapScript = () => {
    if (window.naver && window.naver.maps) {
      console.log("Naver Maps already loaded");
      setIsNaverLoaded(true);
      return;
    }

    console.log("Loading Naver Maps script...");
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://openapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${NAVER_CLIENT_ID}`;
    
    script.onload = () => {
      console.log("Naver Maps script loaded successfully");
      setIsNaverLoaded(true);
      setLoadAttempts(prev => prev + 1);
    };
    
    script.onerror = (error) => {
      console.error("Failed to load Naver Maps script:", error);
      setIsMapError(true);
      toast.error("지도 로드에 실패했습니다. 새로고침해주세요.");
    };
    
    document.head.appendChild(script);
  };

  const initializeMap = () => {
    if (!mapContainer.current || !isNaverLoaded) return;
    if (map.current) return;
    
    try {
      console.log("Initializing map with container:", mapContainer.current);
      console.log("Naver maps object available:", !!window.naver?.maps);
      
      if (!window.naver || !window.naver.maps) {
        console.error("Naver maps not available despite isNaverLoaded being true");
        setIsMapError(true);
        return;
      }

      const options = {
        center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        zoom: 10,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.RIGHT_CENTER
        },
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: window.naver.maps.MapTypeControlStyle.DROPDOWN
        }
      };

      map.current = new window.naver.maps.Map(mapContainer.current, options);
      
      console.log("Map initialized successfully");
      setIsMapInitialized(true);
      toast.success("지도가 로드되었습니다");
      
      // Force a repaint of the container
      setTimeout(() => {
        if (mapContainer.current) {
          mapContainer.current.style.visibility = "hidden";
          setTimeout(() => {
            if (mapContainer.current) {
              mapContainer.current.style.visibility = "visible";
            }
          }, 50);
        }
      }, 100);
      
      drawJejuBoundary();
    } catch (error) {
      console.error("Failed to initialize map:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다");
    }
  };

  const drawJejuBoundary = () => {
    if (!map.current) return;
    
    try {
      // 제주도 경계선 그리기
      const jejuBoundaryPath = JEJU_BOUNDARY.map(coord => 
        new window.naver.maps.LatLng(coord.lat, coord.lng)
      );
      
      // 제주도 해안선 표시
      const polygon = new window.naver.maps.Polygon({
        map: map.current,
        paths: jejuBoundaryPath,
        strokeWeight: 2,
        strokeColor: '#5EAEFF',
        strokeOpacity: 0.8,
        fillColor: '#6CCEA0',
        fillOpacity: 0.2
      });
      
      // 제주도 이름 라벨 표시
      new window.naver.maps.Marker({
        position: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        map: map.current,
        icon: {
          content: `<div style="padding: 5px 10px; background-color: rgba(255,255,255,0.8); border-radius: 20px; font-weight: bold; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">제주도</div>`,
          anchor: new window.naver.maps.Point(30, 10)
        },
        clickable: false
      });
      
      console.log("Jeju boundary drawn successfully");
    } catch (error) {
      console.error("Failed to draw Jeju boundary:", error);
    }
  };

  // Effect to load the Naver Maps script
  useEffect(() => {
    console.log("Initial useEffect - loading Naver Maps script");
    loadNaverMapScript();
    
    // Cleanup function to handle unmounting
    return () => {
      if (map.current) {
        console.log("Cleaning up map instance");
        // Clean up any map resources if needed
      }
    };
  }, []);

  // Effect to initialize the map when the script is loaded
  useEffect(() => {
    console.log("useEffect - isNaverLoaded:", isNaverLoaded);
    if (isNaverLoaded) {
      console.log("Naver loaded, initializing map...");
      initializeMap();
    }
  }, [isNaverLoaded]);

  // Effect to retry loading if needed
  useEffect(() => {
    if (isMapError && loadAttempts < 3) {
      console.log("Map error detected, retrying...");
      const timer = setTimeout(() => {
        setIsMapError(false);
        loadNaverMapScript();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [isMapError, loadAttempts]);

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
    
    if (!window.naver || !window.naver.maps) return;
    
    const bounds = new window.naver.maps.LatLngBounds();
    
    placesToMark.forEach((place, index) => {
      if (typeof place.x !== 'number' || typeof place.y !== 'number') return;
      
      const position = new window.naver.maps.LatLng(place.y, place.x);
      bounds.extend(position);
      
      const markerColor = getCategoryColor(place.category);
      
      // Create custom HTML for marker
      const markerDiv = document.createElement('div');
      markerDiv.className = 'custom-marker animate-fade-in';
      markerDiv.style.width = '30px';
      markerDiv.style.height = '30px';
      markerDiv.style.borderRadius = '50%';
      markerDiv.style.display = 'flex';
      markerDiv.style.alignItems = 'center';
      markerDiv.style.justifyContent = 'center';
      markerDiv.style.fontSize = '14px';
      markerDiv.style.fontWeight = 'bold';
      markerDiv.style.color = 'white';
      markerDiv.style.backgroundColor = markerColor;
      markerDiv.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      markerDiv.style.cursor = 'pointer';
      
      if (isItinerary) {
        markerDiv.textContent = (index + 1).toString();
      } else {
        markerDiv.textContent = place.category.charAt(0).toUpperCase();
      }
      
      const marker = new window.naver.maps.Marker({
        position: position,
        map: map.current,
        title: place.name,
        icon: {
          content: markerDiv,
          size: new window.naver.maps.Size(30, 30),
          anchor: new window.naver.maps.Point(15, 15)
        },
        animation: window.naver.maps.Animation.DROP
      });
      
      markers.current.push(marker);
      
      // Add click event to show place details
      window.naver.maps.Event.addListener(marker, 'click', () => {
        setPopupPlace(place);
        setShowDialog(true);
      });
    });
    
    if (placesToMark.length > 0) {
      // 적절한 줌 레벨로 경계 맞추기 (여백 추가)
      map.current.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
    }
  };

  const drawRoute = (routePlaces: Place[]) => {
    if (!map.current || !isMapInitialized || routePlaces.length <= 1) return;
    
    clearPolylines();
    
    const linePath = routePlaces.map(place => 
      new window.naver.maps.LatLng(place.y, place.x)
    );
    
    const polyline = new window.naver.maps.Polyline({
      path: linePath,
      strokeWeight: 3,
      strokeColor: '#5EAEFF',
      strokeOpacity: 0.8,
      strokeStyle: 'solid',
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
      map: map.current
    });
    
    polylines.current.push(polyline);
    
    // 출발지와 도착지 표시
    const startMarker = new window.naver.maps.Marker({
      position: linePath[0],
      map: map.current,
      icon: {
        content: `<div style="padding: 5px 8px; background-color: #4CAF50; color: white; border-radius: 12px; font-weight: bold; font-size: 12px;">출발</div>`,
        anchor: new window.naver.maps.Point(20, 10)
      },
      zIndex: 100
    });
    
    const endMarker = new window.naver.maps.Marker({
      position: linePath[linePath.length - 1],
      map: map.current,
      icon: {
        content: `<div style="padding: 5px 8px; background-color: #F44336; color: white; border-radius: 12px; font-weight: bold; font-size: 12px;">도착</div>`,
        anchor: new window.naver.maps.Point(20, 10)
      },
      zIndex: 100
    });
    
    markers.current.push(startMarker, endMarker);
  };

  useEffect(() => {
    if (!isMapInitialized || !isNaverLoaded) return;
    
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
  }, [places, selectedPlace, itinerary, selectedDay, isMapInitialized, isNaverLoaded]);

  // Loading or error state
  if (!isNaverLoaded || isMapError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-jeju-light-gray rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4">
          {isMapError ? "지도 로드 오류" : "지도를 불러오는 중..."}
        </h3>
        
        <div className="flex items-center justify-center mb-4">
          {isMapError ? (
            <AlertCircle className="h-8 w-8 text-red-500 animate-pulse" />
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
        
        {isMapError && (
          <Button 
            variant="default" 
            onClick={() => {
              setIsMapError(false);
              loadNaverMapScript();
            }}
          >
            다시 시도
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div id="map-container" ref={mapContainer} className="absolute inset-0 rounded-lg overflow-hidden" style={{visibility: 'visible'}} />
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-md z-10 text-sm">
        <p className="font-medium text-jeju-black">제주도 여행 플래너</p>
      </div>
      
      {/* Map type controls */}
      <div className="absolute top-4 right-4 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-md shadow-md overflow-hidden">
          <button 
            className="px-3 py-1.5 text-sm hover:bg-blue-50 transition-colors" 
            onClick={() => map.current?.setMapTypeId(window.naver.maps.MapTypeId.NORMAL)}
          >
            일반
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
        </div>
      </div>

      {/* Dialog for place details */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{popupPlace?.name}</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {popupPlace && (
              <div className="space-y-3">
                {popupPlace.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{popupPlace.address}</span>
                  </div>
                )}
                
                {popupPlace.operatingHours && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
                    <span className="text-sm">{popupPlace.operatingHours}</span>
                  </div>
                )}
                
                {popupPlace.rating && (
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-400" />
                    <span className="text-sm font-medium">{popupPlace.rating}</span>
                    {popupPlace.reviewCount && (
                      <span className="text-xs text-gray-500">({popupPlace.reviewCount} 리뷰)</span>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2 mt-3">
                  {popupPlace.naverLink && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => window.open(popupPlace.naverLink, '_blank')}
                      className="flex gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      네이버 지도
                    </Button>
                  )}
                  
                  {popupPlace.instaLink && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => window.open(popupPlace.instaLink, '_blank')}
                      className="flex gap-1"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      인스타그램
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Map;
