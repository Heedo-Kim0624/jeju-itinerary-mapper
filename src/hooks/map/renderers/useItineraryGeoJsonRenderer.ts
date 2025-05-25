
import { useCallback, useEffect, useState } from 'react';
import type { Place, ItineraryDay } from '@/types/supabase';
import type { GeoCoordinates } from '@/components/rightpanel/geojson/GeoJsonTypes';
import type { ServerRouteResponse } from '@/types/schedule';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext';
import { isValidCoordinate, coordsToNaverLatLngArray } from '@/utils/map/coordinateUtils';
import { useRouteMemoryStore, DayRouteData } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter';

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  mapPlacesWithGeoNodesFn: (places: Place[]) => Place[]; // To get coordinates for fallback
  addPolyline: ( // This is the function from useRoutePolylines
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null; // Returns Naver Polyline instance or null
  clearAllMapPolylines: () => void; // This will be managed by day now
  // selectedDay and itinerary are no longer direct props, will be taken from store/context
}

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  // clearAllMapPolylines, // Will be replaced by day-specific clearing
}: UseItineraryGeoJsonRendererProps) => {
  const { isGeoJsonLoaded: isContextGeoJsonLoaded, getLinkByLinkIdFromContext } = useGeoJsonContext();
  const { selectedDay, getDayRouteData, setDayRouteData, clearDayPolylines } = useRouteMemoryStore();
  const [isRendering, setIsRendering] = useState(false);

  // This will store polylines created by this renderer for the current day
  const [currentDayPolylines, setCurrentDayPolylines] = useState<any[]>([]);


  const clearCurrentDayPolylinesFromMap = useCallback(() => {
    const dayData = getDayRouteData(selectedDay);
    if (dayData && dayData.polylines) {
        dayData.polylines.forEach(p => p.setMap(null));
    }
    // Also clear any locally tracked polylines not yet in store
    currentDayPolylines.forEach(p => p.setMap(null));
    setCurrentDayPolylines([]);
  }, [selectedDay, getDayRouteData, currentDayPolylines]);


  const renderItineraryRouteForDay = useCallback(async (dayToRender: number, currentItineraryDayData: ItineraryDay | null) => {
    if (!map || !isNaverLoadedParam || !window.naver || !window.naver.maps) {
      console.log('[ItineraryGeoJsonRenderer] Map not ready.');
      return;
    }
    
    setIsRendering(true);
    clearCurrentDayPolylinesFromMap(); // Clear previous polylines for this day from map
    
    const dayRouteInfo = getDayRouteData(dayToRender);

    if (!dayRouteInfo || !dayRouteInfo.linkIds || dayRouteInfo.linkIds.length === 0) {
      console.warn(`[ItineraryGeoJsonRenderer] No linkIds in store for day ${dayToRender}.`);
      // Fallback to direct lines if places exist for the day
      if (currentItineraryDayData && currentItineraryDayData.places && currentItineraryDayData.places.length > 1) {
        const mappedPlaces = mapPlacesWithGeoNodesFn(currentItineraryDayData.places as Place[]); // Cast needed
        const validPlaces = mappedPlaces.filter(p =>
            typeof p.x === 'number' && typeof p.y === 'number' &&
            !isNaN(p.x) && !isNaN(p.y) &&
            isValidCoordinate(p.y, p.x)
        );
        if (validPlaces.length > 1) {
            console.log(`[ItineraryGeoJsonRenderer] No linkIds for day ${dayToRender}, drawing direct lines.`);
            const pathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
            const fallbackPolyline = addPolyline(pathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX - 10);
            const newPolylinesForStore: any[] = [];
            if (fallbackPolyline) newPolylinesForStore.push(fallbackPolyline);
            
            setDayRouteData(dayToRender, { polylines: newPolylinesForStore });
            setCurrentDayPolylines(newPolylinesForStore);

            const naverCoords = coordsToNaverLatLngArray(pathCoordinates, window.naver.maps);
            if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
        }
      }
      setIsRendering(false);
      return;
    }

    try {
      const { linkIds } = dayRouteInfo;
      console.log(`[ItineraryGeoJsonRenderer] Day ${dayToRender}: Rendering route with ${linkIds.length} link IDs from store.`);

      if (!isContextGeoJsonLoaded) {
        console.warn('[ItineraryGeoJsonRenderer] GeoJSON context not loaded. Route rendering might be unreliable.');
      }

      const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
      const newPolylinesThisRender: any[] = [];
      let drawnPolylinesCount = 0;

      for (const linkIdInput of linkIds) {
        const stringLinkIdToFind = String(linkIdInput).trim();
        const linkFeature = getLinkByLinkIdFromContext(stringLinkIdToFind);

        if (linkFeature?.geometry?.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
          const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
          const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
            if (!coordPair || !Array.isArray(coordPair) || coordPair.length < 2) return null;
            const [lng, lat] = coordPair;
            if (!isValidCoordinate(lat, lng)) return null;
            return { lat, lng };
          }).filter(c => c !== null) as { lat: number; lng: number }[];

          if (pathCoordsForPolyline.length >= 2) {
            const polylineInstance = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
            if (polylineInstance) {
              newPolylinesThisRender.push(polylineInstance);
              drawnPolylinesCount++;
              allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
            }
          }
        } else {
          console.warn(`[ItineraryGeoJsonRenderer] Day ${dayToRender}: Link ID "${stringLinkIdToFind}" not found or invalid geometry.`);
        }
      }
      
      setDayRouteData(dayToRender, { polylines: newPolylinesThisRender });
      setCurrentDayPolylines(newPolylinesThisRender);
      console.log(`[ItineraryGeoJsonRenderer] Day ${dayToRender}: ${drawnPolylinesCount} polylines drawn.`);

      if (allRouteCoordinatesForBounds.length > 0) {
        const flatCoordsForBounds = allRouteCoordinatesForBounds.flat();
        if (flatCoordsForBounds.length > 0) {
          const naverCoords = coordsToNaverLatLngArray(flatCoordsForBounds, window.naver.maps);
          if (naverCoords.length > 0) {
            fitBoundsToCoordinates(map, naverCoords);
          }
        }
      } else if (currentItineraryDayData?.places?.length) {
        // Fallback to fit bounds to places if no route drawn but places exist
        const mappedPlaces = mapPlacesWithGeoNodesFn(currentItineraryDayData.places as Place[]);
         const validPlacesCoords = mappedPlaces
                .filter(p => typeof p.y === 'number' && typeof p.x === 'number' && !isNaN(p.y) && !isNaN(p.x) && isValidCoordinate(p.y,p.x))
                .map(p => ({ lat: p.y as number, lng: p.x as number }));
        if (validPlacesCoords.length > 0) {
            const naverCoords = coordsToNaverLatLngArray(validPlacesCoords, window.naver.maps);
             if (naverCoords.length > 0) {
               fitBoundsToCoordinates(map, naverCoords);
             }
        }
      }

    } catch (error) {
      console.error(`[ItineraryGeoJsonRenderer] Day ${dayToRender}: Error rendering itinerary route:`, error);
    } finally {
      setIsRendering(false);
    }
  }, [
      map, isNaverLoadedParam, getLinkByLinkIdFromContext, isContextGeoJsonLoaded, 
      addPolyline, mapPlacesWithGeoNodesFn, 
      getDayRouteData, setDayRouteData, clearCurrentDayPolylinesFromMap
    ]
  );
  
  // Effect to render route when selectedDay from store changes or map becomes ready
  // It also needs the actual ItineraryDay data for fallback place rendering
  // This part is tricky: where does `currentItineraryDayData` come from?
  // Let's assume for now that `renderItineraryRoute` (the one returned by the hook)
  // will be called with this data from `useRouteManager` or similar.
  // The `useEffect` below will be removed or rethought as rendering should be triggered by `useRouteManager`
  // based on `mapDayChanged` event.

  // This hook now primarily provides a function to render a specific day's route.
  // The calling component (e.g., useRouteManager) will manage *when* to call this.

  return { renderItineraryRouteForDay, isRendering };
};
