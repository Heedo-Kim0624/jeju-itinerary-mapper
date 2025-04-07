
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    naver: any;
  }
}

interface NaverMapProps {
  places?: any[];
  selectedPlace?: any | null;
  center?: { lat: number; lng: number };
  zoom?: number;
}

const NaverMap = ({ 
  places = [], 
  selectedPlace = null, 
  center = { lat: 33.3617, lng: 126.5292 },
  zoom = 10
}: NaverMapProps) => {
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  // Load Naver Map API
  useEffect(() => {
    const script = document.createElement("script");
    script.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpClientId=${import.meta.env.VITE_NAVER_CLIENT_ID}`;
    script.async = true;
    
    script.onload = initializeMap;
    document.head.appendChild(script);
    
    return () => {
      // Clean up
      if (markersRef.current) {
        markersRef.current.forEach(marker => {
          if (marker) marker.setMap(null);
        });
        markersRef.current = [];
      }
    };
  }, []);

  // Initialize map
  const initializeMap = () => {
    if (window.naver) {
      const mapOptions = {
        center: new window.naver.maps.LatLng(center.lat, center.lng),
        zoom: zoom,
        zoomControl: true,
        zoomControlOptions: {
          position: window.naver.maps.Position.TOP_RIGHT
        }
      };
      
      mapRef.current = new window.naver.maps.Map("map", mapOptions);
      
      // If places data is available, update markers
      if (places && places.length > 0) {
        updateMarkers();
      }
    }
  };

  // Update markers when places change
  useEffect(() => {
    if (window.naver && mapRef.current && places) {
      updateMarkers();
    }
  }, [places]);

  // Update selected marker when selectedPlace changes
  useEffect(() => {
    if (window.naver && mapRef.current && selectedPlace) {
      focusOnPlace(selectedPlace);
    }
  }, [selectedPlace]);

  const updateMarkers = () => {
    // Clear existing markers
    if (markersRef.current) {
      markersRef.current.forEach(marker => {
        if (marker) marker.setMap(null);
      });
      markersRef.current = [];
    }

    // Add new markers
    if (places && places.length > 0) {
      markersRef.current = places.map(place => {
        if (!place.y || !place.x) return null;
        
        const marker = new window.naver.maps.Marker({
          position: new window.naver.maps.LatLng(place.y, place.x),
          map: mapRef.current,
          title: place.name,
          icon: {
            content: `<div style="background-color: white; padding: 2px 6px; border-radius: 10px; border: 1px solid #333; font-size: 10px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${place.name}</div>`,
            anchor: new window.naver.maps.Point(10, 10)
          }
        });
        
        window.naver.maps.Event.addListener(marker, 'click', () => {
          console.log('Marker clicked:', place);
          // Handle marker click here
        });
        
        return marker;
      }).filter(marker => marker !== null);
    }
  };

  const focusOnPlace = (place: any) => {
    if (!place || !place.y || !place.x) return;
    
    // Move map to selected place
    const position = new window.naver.maps.LatLng(place.y, place.x);
    mapRef.current.setCenter(position);
    
    // Zoom in slightly closer
    mapRef.current.setZoom(13);
    
    // Highlight the marker
    markersRef.current.forEach(marker => {
      if (marker && marker.getTitle() === place.name) {
        marker.setAnimation(window.naver.maps.Animation.BOUNCE);
        setTimeout(() => {
          marker.setAnimation(null);
        }, 2000);
      }
    });
  };

  return (
    <div
      id="map"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "500px",
      }}
    />
  );
};

export default NaverMap;
