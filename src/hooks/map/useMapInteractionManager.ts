
import { useCallback } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import { createNaverLatLng } from '@/utils/map/mapDrawing';
import { getCategoryColor, mapCategoryNameToKey } from '@/utils/categoryColors';

interface UseMapInteractionManagerProps {
  map: any;
  isNaverLoadedParam: boolean;
}

export const useMapInteractionManager = ({ map, isNaverLoadedParam }: UseMapInteractionManagerProps) => {
  const addMarkers = useCallback((
    placesToAdd: Place[],
    options: {
      highlightPlaceId?: string;
      isItinerary?: boolean;
      useRecommendedStyle?: boolean; // This option seems unused in the original addMarkers body, but kept for signature consistency
      useColorByCategory?: boolean;
      onMarkerClick?: (place: Place, index: number) => void;
      itineraryOrder?: boolean;
    } = {}
  ): any[] => {
    if (!map || !isNaverLoadedParam || !placesToAdd || placesToAdd.length === 0) return [];

    const {
      highlightPlaceId,
      isItinerary = false,
      useColorByCategory = false,
      onMarkerClick,
      itineraryOrder = false
    } = options;

    const validPlaces = placesToAdd.filter(place =>
      place && typeof place.x === 'number' && typeof place.y === 'number' &&
      !isNaN(place.x) && !isNaN(place.y)
    );

    if (validPlaces.length === 0) {
      console.warn('[MapInteractionManager - addMarkers] No valid coordinates in places array');
      return [];
    }

    const createdMarkers: any[] = [];

    validPlaces.forEach((place, index) => {
      const position = createNaverLatLng(place.y, place.x);
      if (!position) {
        console.warn(`[MapInteractionManager - addMarkers] Failed to create LatLng for '${place.name}'. Skipping marker.`);
        return;
      }

      const isHighlighted = place.id === highlightPlaceId;
      const categoryKey = mapCategoryNameToKey(place.category);
      const resolvedCategoryColor = getCategoryColor(categoryKey);
      const markerBaseColor = useColorByCategory ? resolvedCategoryColor : (isHighlighted ? '#FF3B30' : '#4CD964');

      let markerIcon;
      if (isItinerary && itineraryOrder) {
        markerIcon = {
          content: `
            <div style="
              width: 28px; height: 28px; border-radius: 50%; 
              background-color: ${markerBaseColor};
              color: white; font-weight: bold; display: flex;
              align-items: center; justify-content: center;
              box-shadow: 0 1px 3px rgba(0,0,0,0.3); border: 1.5px solid white;
              font-size: 13px;
            ">${index + 1}</div>
          `,
          anchor: new window.naver.maps.Point(14, 14)
        };
      } else if (isHighlighted) {
         markerIcon = {
          content: `
            <div style="
              width: 30px; height: 30px; border-radius: 50%; 
              background-color: #FF3B30; 
              color: white; display: flex;
              align-items: center; justify-content: center;
              box-shadow: 0 2px 6px rgba(0,0,0,0.5); border: 2px solid white;
              font-size: 16px; 
            ">⭐</div>
          `,
          anchor: new window.naver.maps.Point(15, 15)
        };
      } else {
        markerIcon = {
          content: `
            <div style="
              width: 12px; height: 12px; border-radius: 50%;
              background-color: ${markerBaseColor};
              border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.3);
            "></div>
          `,
          anchor: new window.naver.maps.Point(6, 6)
        };
      }

      try {
        const marker = new window.naver.maps.Marker({
          position: position,
          map: map,
          title: place.name,
          icon: markerIcon,
          zIndex: isHighlighted ? 200 : (isItinerary && itineraryOrder ? 100 - index : 50)
        });

        const contentString = `
          <div style="padding: 8px; max-width: 180px; font-size: 12px;">
            <h3 style="font-weight: bold; margin-bottom: 4px; font-size: 13px;">${place.name}</h3>
            ${place.category ? `<p style="color: ${resolvedCategoryColor}; margin: 2px 0; font-size: 11px;">${place.category}</p>` : ''}
            ${isItinerary && itineraryOrder ? `<strong style="color: ${markerBaseColor}; font-size: 13px;">Visit order: ${index + 1}</strong>` : ''}
          </div>
        `;

        const infoWindow = new window.naver.maps.InfoWindow({
          content: contentString,
          maxWidth: 200,
          backgroundColor: "white",
          borderColor: "#ccc",
          borderWidth: 1,
          anchorSize: new window.naver.maps.Size(8, 8),
          pixelOffset: new window.naver.maps.Point(0, -15)
        });

        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindow.open(map, marker);
          if (onMarkerClick) {
            onMarkerClick(place, index);
          }
        });
        createdMarkers.push(marker);
      } catch (error) {
        console.error(`[MapInteractionManager - addMarkers] Error creating marker for ${place.name}:`, error);
      }
    });
    return createdMarkers;
  }, [map, isNaverLoadedParam]);

  const showRouteForPlaceIndex = useCallback( // Renamed from showRouteForPlace to showRouteForPlaceIndex for consistency
    (placeIndex: number, itineraryDay: ItineraryDay, onComplete?: () => void) => {
      if (!map || !isNaverLoadedParam || !itineraryDay || !itineraryDay.places) {
        if (onComplete) onComplete();
        return;
      }
      
      const place = itineraryDay.places[placeIndex];
      if (place && typeof place.y === 'number' && typeof place.x === 'number') {
          const position = createNaverLatLng(place.y, place.x);
          if (position) {
              map.panTo(position);
              if (map.getZoom() < 14) map.setZoom(14);
          }
      } else {
        console.warn(`[MapInteractionManager] showRouteForPlaceIndex: Place ${placeIndex} has invalid coordinates.`);
      }

      if (onComplete) onComplete();
    },
    [map, isNaverLoadedParam]
  );

  return { addMarkers, showRouteForPlaceIndex };
};
