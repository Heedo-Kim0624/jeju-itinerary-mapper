
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
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

const Map: React.FC<MapProps> = ({ places, selectedPlace, itinerary, selectedDay }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const [mapToken, setMapToken] = useState<string>("");
  const [isMapInitialized, setIsMapInitialized] = useState<boolean>(false);

  const initializeMap = () => {
    if (!mapboxgl.accessToken && !mapToken) {
      return;
    }
    
    if (!mapContainer.current) return;
    if (map.current) return;

    try {
      mapboxgl.accessToken = mapToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [126.5311884, 33.3846216], // Jeju Island center
        zoom: 10,
        pitch: 40,
        attributionControl: false
      });

      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      map.current.on('load', () => {
        setIsMapInitialized(true);
        toast.success("지도가 로드되었습니다");
        
        // Add custom Jeju SHP layer (placeholder)
        if (map.current) {
          map.current.addSource('jeju-boundary', {
            type: 'geojson',
            data: {
              type: 'Feature',
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [126.15, 33.10], // Simplified Jeju boundary for demonstration
                    [126.95, 33.10],
                    [126.95, 33.60],
                    [126.15, 33.60],
                    [126.15, 33.10]
                  ]
                ]
              },
              properties: {}
            }
          });
          
          map.current.addLayer({
            id: 'jeju-boundary-fill',
            type: 'fill',
            source: 'jeju-boundary',
            paint: {
              'fill-color': '#6CCEA0',
              'fill-opacity': 0.1
            }
          });
          
          map.current.addLayer({
            id: 'jeju-boundary-line',
            type: 'line',
            source: 'jeju-boundary',
            paint: {
              'line-color': '#5EAEFF',
              'line-width': 2,
              'line-opacity': 0.7
            }
          });
        }
      });
      
    } catch (error) {
      console.error("Failed to initialize map:", error);
      toast.error("지도 로드에 실패했습니다. 맵박스 토큰을 확인해주세요.");
    }
  };

  useEffect(() => {
    if (mapToken) {
      initializeMap();
    }
  }, [mapToken]);

  const clearMarkers = () => {
    markers.current.forEach(marker => marker.remove());
    markers.current = [];
  };

  const addMarkers = (placesToMark: Place[], isItinerary: boolean = false) => {
    if (!map.current || !isMapInitialized) return;
    
    clearMarkers();
    
    placesToMark.forEach((place, index) => {
      // Skip if we don't have coordinates
      if (typeof place.x !== 'number' || typeof place.y !== 'number') return;
      
      // Create custom marker element
      const el = document.createElement('div');
      el.className = 'custom-marker animate-fade-in';
      el.style.width = '30px';
      el.style.height = '30px';
      el.style.borderRadius = '50%';
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontSize = '14px';
      el.style.fontWeight = 'bold';
      el.style.color = 'white';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.3)';
      
      if (isItinerary) {
        // For itinerary, show the stop number
        el.style.backgroundColor = '#5EAEFF';
        el.textContent = (index + 1).toString();
      } else {
        // Color based on category
        switch (place.category) {
          case 'restaurant':
            el.style.backgroundColor = '#FF8C3E';
            break;
          case 'cafe':
            el.style.backgroundColor = '#6CCEA0';
            break;
          case 'attraction':
            el.style.backgroundColor = '#5EAEFF';
            break;
          case 'accommodation':
            el.style.backgroundColor = '#9B87F5';
            break;
          default:
            el.style.backgroundColor = '#1F1F1F';
        }
        
        // First letter of category
        el.textContent = place.category.charAt(0).toUpperCase();
      }
      
      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([place.x, place.y])
        .addTo(map.current);
        
      // Add a popup
      new mapboxgl.Popup({
        offset: 25,
        closeButton: false,
        className: 'custom-popup'
      })
        .setHTML(`<div class="font-medium">${place.name}</div>`)
        .setLngLat([place.x, place.y])
        .addTo(map.current);
      
      markers.current.push(marker);
    });
    
    // If we have places to show, fit the map to include all markers
    if (placesToMark.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      placesToMark.forEach(place => {
        if (typeof place.x === 'number' && typeof place.y === 'number') {
          bounds.extend([place.x, place.y]);
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: 15,
        duration: 1000
      });
    }
  };
  
  useEffect(() => {
    // Determine what to display on the map
    if (itinerary && selectedDay !== null) {
      // Show itinerary for a specific day
      const dayPlaces = itinerary.find(day => day.day === selectedDay)?.places || [];
      if (dayPlaces.length > 0) {
        addMarkers(dayPlaces, true);
        
        // Also draw the route if we have more than one place
        if (dayPlaces.length > 1 && map.current && isMapInitialized) {
          // Remove any existing route
          if (map.current.getLayer('route')) {
            map.current.removeLayer('route');
          }
          if (map.current.getSource('route')) {
            map.current.removeSource('route');
          }
          
          // Add route as a line
          map.current.addSource('route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: dayPlaces.map(place => [place.x, place.y])
              }
            }
          });
          
          map.current.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#5EAEFF',
              'line-width': 3,
              'line-opacity': 0.8,
              'line-dasharray': [0.5, 1.5]
            }
          });
        }
      }
    } else if (selectedPlace) {
      // Show just the selected place
      addMarkers([selectedPlace]);
    } else if (places.length > 0) {
      // Show all places
      addMarkers(places);
    }
  }, [places, selectedPlace, itinerary, selectedDay, isMapInitialized]);

  if (!mapToken) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-jeju-light-gray rounded-lg p-6">
        <h3 className="text-xl font-medium mb-4">Mapbox 토큰이 필요합니다</h3>
        <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
          제주도 지도를 표시하기 위해 Mapbox 토큰이 필요합니다. 토큰은 <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Mapbox</a>에서 무료로 발급받을 수 있습니다.
        </p>
        <div className="flex items-center gap-2 w-full max-w-md">
          <input 
            type="text" 
            placeholder="Mapbox 토큰을 입력하세요" 
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={mapToken}
            onChange={(e) => setMapToken(e.target.value)}
          />
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            onClick={initializeMap}
          >
            적용
          </button>
        </div>
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
