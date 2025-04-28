
import { useCallback } from 'react';
import { Place } from '@/types/supabase';

type MarkerOptions = {
  highlight?: boolean;
  isItinerary?: boolean;
  useRecommendedStyle?: boolean;
};

export const useMapMarkers = (map: any) => {
  const addMarkers = useCallback((places: Place[], options: MarkerOptions = {}) => {
    if (!map || !window.naver || !places.length) return () => {};
    
    const markers: any[] = [];
    const infoWindows: any[] = [];
    
    places.forEach((place) => {
      if (!place.y || !place.x) return;
      
      const position = new window.naver.maps.LatLng(place.y, place.x);
      
      let pinColor = '#FF6B6B'; // Default red

      // Determine pin color based on category and options
      if (options.highlight) {
        pinColor = '#3366FF'; // Blue for highlighted
      } else if (options.isItinerary) {
        pinColor = '#22c55e'; // Green for itinerary
      } else if (options.useRecommendedStyle) {
        pinColor = '#FF9500'; // Orange for recommended
      } else {
        // Default colors by category
        switch (place.category) {
          case 'restaurant':
            pinColor = '#FF6B6B'; // Red for restaurants
            break;
          case 'cafe':
            pinColor = '#8B5CF6'; // Purple for cafes
            break;
          case 'accommodation':
            pinColor = '#EC4899'; // Pink for accommodations
            break;
          case 'attraction':
            pinColor = '#10B981'; // Emerald for attractions
            break;
        }
      }
      
      const marker = new window.naver.maps.Marker({
        position,
        map,
        icon: {
          content: `
            <div style="cursor:pointer;width:22px;height:22px;line-height:22px;
                      text-align:center;font-size:12px;font-weight:bold;
                      background-color:${pinColor};color:white;
                      border-radius:50%;border:2px solid white;
                      box-shadow:0 2px 6px rgba(0,0,0,0.3);">
              ${place.isSelected ? '✓' : ''}
            </div>
          `,
          anchor: new window.naver.maps.Point(11, 11)
        },
        zIndex: options.highlight ? 100 : 10,
        title: place.name
      });
      
      // Create and configure info window
      const infoWindow = new window.naver.maps.InfoWindow({
        content: `
          <div style="padding:10px;max-width:200px;font-size:12px;">
            <b>${place.name}</b>
            <p style="margin:4px 0;font-size:11px;">${place.address}</p>
            ${place.rating ? `<p style="margin:2px 0;font-size:11px;">⭐ ${place.rating.toFixed(1)}${place.reviewCount ? ` (${place.reviewCount})` : ''}</p>` : ''}
          </div>
        `,
        borderColor: pinColor,
        borderWidth: 2,
        disableAnchor: true,
        pixelOffset: new window.naver.maps.Point(0, -10)
      });
      
      // Add event listeners to the marker
      window.naver.maps.Event.addListener(marker, 'click', () => {
        if (infoWindow.getMap()) {
          infoWindow.close();
        } else {
          infoWindow.open(map, marker);
        }
      });
      
      markers.push(marker);
      infoWindows.push(infoWindow);
    });
    
    // Return a cleanup function
    return () => {
      markers.forEach(marker => marker.setMap(null));
      infoWindows.forEach(iw => iw.close());
    };
  }, [map]);
  
  const clearMarkersAndUiElements = useCallback(() => {
    if (!map) return;
    return () => {
      // This function intentionally left empty
      // The actual cleanup happens when returned function from addMarkers is called
    };
  }, [map]);
  
  return { addMarkers, clearMarkersAndUiElements };
};
