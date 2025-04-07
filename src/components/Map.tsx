import React, { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { getCategoryColor } from '@/utils/categoryColors';
import { loadNaverMaps } from "@/utils/loadNaverMaps";

interface Place {
  id: string;
  name: string;
  address: string;
  operatingHours: string;
  naverLink: string;
  instaLink: string;
  rating: number;
  reviewCount: number;
  category: string;
  x: number;
  y: number;
  operationTimeData?: {
    [key: string]: number;
  };
  nodeId?: string;
}

interface ItineraryDay {
  day: number;
  places: Place[];
  totalDistance: number;
}

interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
}

const Map: React.FC<MapProps> = ({ places, selectedPlace, itinerary, selectedDay }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const infoWindows = useRef<any[]>([]);
  const polylines = useRef<any[]>([]);
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);
  const [isNaverLoaded, setIsNaverLoaded] = useState<boolean>(false);
  const [isMapError, setIsMapError] = useState<boolean>(false);

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

  const clearMarkersAndUiElements = () => {
    clearMarkers();
    clearInfoWindows();
    clearPolylines();
  };

  useEffect(() => {
    if (isNaverLoaded) {
      initializeMap();
    }
  }, [isNaverLoaded]);

<<<<<<< HEAD
  useEffect(() => {
    if (mapContainer.current) {
      console.log("🧪 mapContainer height:", mapContainer.current.offsetHeight);
    }
  }, [mapContainer.current]);
  
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

=======
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b
  const initializeMap = () => {
    if (!mapContainer.current || !window.naver || !window.naver.maps) {
<<<<<<< HEAD
      console.error("Cannot initialize map - container or naver maps not available");
      console.log("Map container size:", mapContainer.current?.offsetWidth, mapContainer.current?.offsetHeight);
=======
      console.error("Naver Maps is not available");
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b
      return;
    }

<<<<<<< HEAD
      const options = {
        center: new window.naver.maps.LatLng(JEJU_CENTER.lat, JEJU_CENTER.lng),
        zoom: 11,
        minZoom: 10,
        maxZoom: 18,
=======
    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(33.3846216, 126.5311884),
        zoom: 10,
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT
        }
      };

      map.current = new window.naver.maps.Map(mapContainer.current, mapOptions);
      setIsMapInitialized(true);

      window.naver.maps.Event.once(map.current, 'init', () => {
        console.log("Naver Map initialized");
        renderData();
      });
    } catch (error) {
      console.error("Error initializing map:", error);
      setIsMapError(true);
      toast.error("지도 초기화에 실패했습니다.");
    }
  };

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("Map is not yet initialized.");
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const selectedItinerary = itinerary.find(day => day.day === selectedDay);
      if (selectedItinerary) {
        addMarkers(selectedItinerary.places, true);
        calculateRoutes(selectedItinerary.places);
      } else {
        console.warn(`No itinerary found for day ${selectedDay}`);
        clearPolylines();
        addMarkers(places);
      }
    } else {
      clearPolylines();
      addMarkers(places);
    }
  };

  useEffect(() => {
    if (isMapInitialized) {
      renderData();
    }
  }, [places, selectedPlace, itinerary, selectedDay, isMapInitialized]);

  const clearMarkers = () => {
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
  };

  const clearInfoWindows = () => {
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
  };

  const clearPolylines = () => {
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

  const calculateRoutes = (placesToRoute: Place[]) => {
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
  };

  const addMarkers = (placesToMark: Place[], isItinerary: boolean = false) => {
    if (!map.current || !isMapInitialized || !window.naver) return;
    
    clearMarkersAndUiElements();
    
    console.log(`Adding ${placesToMark.length} markers, isItinerary:`, isItinerary);
<<<<<<< HEAD
    
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
        markerDiv.style.transition = 'transform 0.2s ease';
        markerDiv.style.animation = 'dropIn 0.5s ease-out';
        
        if (isItinerary) {
          markerDiv.textContent = (index + 1).toString();
        } else {
          markerDiv.textContent = place.category.charAt(0).toUpperCase();
        }
        
        const infoWindow = new window.naver.maps.InfoWindow({
          content: createInfoWindowContent(place),
          borderWidth: 0,
          disableAnchor: true,
          backgroundColor: "transparent",
          borderColor: "transparent",
          pixelOffset: new window.naver.maps.Point(0, -10)
        });
        
        infoWindows.current.push(infoWindow);
        
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map.current,
          title: place.name
        });
        
        window.naver.maps.Event.addListener(marker, 'mouseover', () => {
          markerDiv.style.transform = 'scale(1.2)';
        });
        
        window.naver.maps.Event.addListener(marker, 'mouseout', () => {
          markerDiv.style.transform = 'scale(1)';
        });
        
        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(map.current, marker);
          setPopupPlace(place);
          setShowDialog(true);
        });
        
        markers.current.push(marker);
      });
      
      if (placesToMark.length > 0) {
        console.log("Fitting map to bounds");
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
  };
=======
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b

    placesToMark.forEach(place => {
      const marker = new window.naver.maps.Marker({
        map: map.current,
        position: new window.naver.maps.LatLng(place.y, place.x),
        title: place.name,
        icon: {
          content: `<div style="width: 24px; height: 24px; background-color: ${getCategoryColor(place.category)}; 
                           border-radius: 50%; display: flex; justify-content: center; align-items: center;
                           color: white; font-size: 12px; border: 2px solid white;">
                      </div>`,
          size: new window.naver.maps.Size(24, 24),
          anchor: new window.naver.maps.Point(12, 12)
        },
        zIndex: isItinerary ? 2 : 1
      });

      markers.current.push(marker);

      const contentString = `
        <div style="padding: 5px; text-align: center;">
          <h6 style="margin:0; font-weight: bold;">${place.name}</h6>
          <small>${place.category}</small>
        </div>
      `;

      const infoWindow = new window.naver.maps.InfoWindow({
        content: contentString,
        disableAnchor: true,
        borderWidth: 0,
        backgroundColor: "rgba(255,255,255,0.9)"
      });

<<<<<<< HEAD
  useEffect(() => {
    if (!isMapInitialized || !window.naver) {
      console.log("Map not ready for data rendering");
      return;
    }
    
    console.log("Data changed, updating map visualization");
    console.log("- selectedPlace:", selectedPlace?.name);
    console.log("- places count:", places?.length);
    console.log("- itinerary days:", itinerary?.length);
    console.log("- selectedDay:", selectedDay);
    
    if (itinerary && selectedDay !== null) {
      // 일정 기반 마커 표시
      const dayPlaces = itinerary.find(day => day.day === selectedDay)?.places || [];
      addMarkers(dayPlaces, true);
      if (dayPlaces.length > 1) drawRoute(dayPlaces);
    
    } else if (selectedPlaces.length > 0) {
      // ✅ 선택된 장소만 표시
      addMarkers(selectedPlaces);
    
    } else if (selectedPlace) {
      // 단일 장소 선택 시
      addMarkers([selectedPlace]);
    
    } else if (places.length > 0) {
      // 기본 전체 표시
      addMarkers(places);
    }
    } else {
      clearMarkers();
    }
  }, [places, selectedPlace, itinerary, selectedDay, isMapInitialized]);
=======
      infoWindows.current.push(infoWindow);
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b

      window.naver.maps.Event.addListener(marker, 'click', () => {
        infoWindows.current.forEach(iw => iw.close());
        infoWindow.open(map.current, marker);
      });
    });
  };

  return (
<<<<<<< HEAD
    <div className="relative w-full h-full flex items-center justify-center">
      {showJejuVisualizer ? (
        <JejuVisualizer className="w-full h-full" />
      ) : (
        <>
          <div
            id="map-container"
            ref={mapContainer}
            style={{ width: '100%', height: '600px', visibility: 'visible' }}
            className="absolute inset-0 rounded-lg overflow-hidden bg-white"
          />
          
          {!isMapInitialized && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-medium">지도를 초기화하는 중...</p>
              </div>
            </div>
          )}
        </>
      )}
      
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-md shadow-md z-10 text-sm flex items-center gap-2">
        <p className="font-medium text-jeju-black">제주도 여행 플래너</p>
        <Button 
          variant="outline" 
          size="sm" 
          className="ml-2 text-xs"
          onClick={toggleJejuVisualizer}
        >
          {showJejuVisualizer ? '일반 지도로 보기' : '제주도 전체 보기'}
        </Button>
      </div>
      
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
=======
    <div ref={mapContainer} className="w-full h-full relative">
      {!isNaverLoaded && !isMapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">지도를 불러오는 중...</div>
            <div className="loader"></div>
          </div>
>>>>>>> 2e4a9fb9cce458aa1890df5d6c6bc531540fe60b
        </div>
      )}
      {isMapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">지도 로딩 실패</div>
            <p>지도를 불러오는 데 문제가 발생했습니다. 다시 시도해주세요.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
