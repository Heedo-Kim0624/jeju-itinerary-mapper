import { useEffect, useRef, useState } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { ItineraryPlaceWithTime } from '@/types';

export const useMapFeatures = () => {
  const { map, markers, polylines, infoWindows } = useMapContext();
  const [selectedMarker, setSelectedMarker] = useState<number | null>(null);
  const [visibleInfoWindow, setVisibleInfoWindow] = useState<number | null>(null);
  const markerRefs = useRef<any[]>([]);
  const infoWindowRefs = useRef<any[]>([]);
  const polylineRefs = useRef<any[]>([]);

  // Clear all map features
  const clearMapFeatures = () => {
    // Clear markers
    markerRefs.current.forEach(marker => {
      if (marker && marker.setMap) {
        marker.setMap(null);
      }
    });
    markerRefs.current = [];

    // Clear info windows
    infoWindowRefs.current.forEach(infoWindow => {
      if (infoWindow && infoWindow.close) {
        infoWindow.close();
      }
    });
    infoWindowRefs.current = [];

    // Clear polylines
    polylineRefs.current.forEach(polyline => {
      if (polyline && polyline.setMap) {
        polyline.setMap(null);
      }
    });
    polylineRefs.current = [];

    // Reset state
    setSelectedMarker(null);
    setVisibleInfoWindow(null);
  };

  // Add a marker to the map
  const addMarker = (lat: number, lng: number, title: string, icon?: string) => {
    if (!map || !window.naver) return null;

    const position = new window.naver.maps.LatLng(lat, lng);
    const markerOptions: any = {
      position,
      map,
      title,
    };

    if (icon) {
      markerOptions.icon = {
        url: icon,
        size: new window.naver.maps.Size(24, 24),
        origin: new window.naver.maps.Point(0, 0),
        anchor: new window.naver.maps.Point(12, 12),
      };
    }

    const marker = new window.naver.maps.Marker(markerOptions);
    markerRefs.current.push(marker);
    return marker;
  };

  // Add an info window to the map
  const addInfoWindow = (content: string) => {
    if (!window.naver) return null;

    const infoWindow = new window.naver.maps.InfoWindow({
      content,
      maxWidth: 300,
      backgroundColor: "#fff",
      borderColor: "#ddd",
      borderWidth: 1,
      anchorSize: new window.naver.maps.Size(10, 10),
      anchorSkew: true,
      anchorColor: "#fff",
      pixelOffset: new window.naver.maps.Point(10, -10),
    });

    infoWindowRefs.current.push(infoWindow);
    return infoWindow;
  };

  // Add a polyline to the map
  const addPolyline = (path: { lat: number; lng: number }[], options?: any) => {
    if (!map || !window.naver) return null;

    const defaultOptions = {
      strokeColor: '#5347AA',
      strokeOpacity: 0.8,
      strokeWeight: 3,
    };

    const polylineOptions = {
      ...defaultOptions,
      ...options,
      path: path.map(point => new window.naver.maps.LatLng(point.lat, point.lng)),
      map,
    };

    const polyline = new window.naver.maps.Polyline(polylineOptions);
    polylineRefs.current.push(polyline);
    return polyline;
  };

  // Create markers for itinerary places
  const createItineraryMarkers = (places: ItineraryPlaceWithTime[]) => {
    clearMapFeatures();

    if (!map || !window.naver || !places.length) return;

    const bounds = new window.naver.maps.LatLngBounds();

    places.forEach((place, index) => {
      if (!place.y || !place.x) return;

      const marker = addMarker(place.y, place.x, place.name);
      if (!marker) return;

      const infoContent = `
        <div style="padding: 10px; max-width: 200px;">
          <h3 style="margin: 0 0 5px; font-size: 14px;">${place.name}</h3>
          <p style="margin: 0; font-size: 12px; color: #666;">${place.timeBlock || ''}</p>
          ${place.address ? `<p style="margin: 5px 0 0; font-size: 12px;">${place.address}</p>` : ''}
        </div>
      `;

      const infoWindow = addInfoWindow(infoContent);
      if (!infoWindow) return;

      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (visibleInfoWindow !== null && infoWindowRefs.current[visibleInfoWindow]) {
          infoWindowRefs.current[visibleInfoWindow].close();
        }
        infoWindow.open(map, marker);
        setSelectedMarker(index);
        setVisibleInfoWindow(index);
      });

      bounds.extend(new window.naver.maps.LatLng(place.y, place.x));
    });

    // Fit map to bounds if there are places
    if (places.length > 0) {
      map.fitBounds(bounds, {
        top: 50,
        right: 50,
        bottom: 50,
        left: 50
      });
    }
  };

  // Create a route polyline between places
  const createRouteBetweenPlaces = (places: ItineraryPlaceWithTime[]) => {
    if (!map || !window.naver || places.length < 2) return;

    const path = places
      .filter(place => place.y && place.x)
      .map(place => ({ lat: place.y, lng: place.x }));

    if (path.length < 2) return;

    addPolyline(path);
  };

  // Clean up on unmount
  useEffect(() => {
    return () => {
      clearMapFeatures();
    };
  }, []);

  return {
    clearMapFeatures,
    addMarker,
    addInfoWindow,
    addPolyline,
    createItineraryMarkers,
    createRouteBetweenPlaces,
    selectedMarker,
    visibleInfoWindow,
  };
};
