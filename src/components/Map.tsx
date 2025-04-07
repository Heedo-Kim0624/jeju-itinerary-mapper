import React, { useEffect, useRef, useState } from 'react';
import { toast } from "sonner";
import { getCategoryColor } from '@/utils/categoryColors';
import { loadNaverMaps } from "@/utils/loadNaverMaps";
// Fix the import issue - we're importing from mapStyles.css.ts, not mapStyles.css
import { MapStyles } from '@/utils/mapStyles.css';

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

  const initializeMap = () => {
    if (!mapContainer.current || !window.naver || !window.naver.maps) {
      console.error("Naver Maps is not available");
      return;
    }

    try {
      const mapOptions = {
        center: new window.naver.maps.LatLng(33.3846216, 126.5311884),
        zoom: 10,
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

      infoWindows.current.push(infoWindow);

      window.naver.maps.Event.addListener(marker, 'click', () => {
        infoWindows.current.forEach(iw => iw.close());
        infoWindow.open(map.current, marker);
      });
    });
  };

  return (
    <div ref={mapContainer} className="w-full h-full relative">
      {!isNaverLoaded && !isMapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">지도를 불러오는 중...</div>
            <div className="loader"></div>
          </div>
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
