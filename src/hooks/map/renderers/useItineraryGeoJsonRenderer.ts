
import { useCallback, useEffect, useState } from 'react';
import type { ItineraryDay as CoreItineraryDay, Place as CorePlace, ItineraryPlace } from '@/types/core';
import type { GeoCoordinates, GeoLink } from '@/components/rightpanel/geojson/GeoJsonTypes';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToCoordinates } from '@/utils/map/mapViewControls';
import { useGeoJsonContext } from '@/contexts/GeoJsonContext';
import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore'; 
import { useEventEmitter } from '@/hooks/events/useEventEmitter'; 

const USER_ROUTE_COLOR = '#2563EB';
const USER_ROUTE_WEIGHT = 5;
const USER_ROUTE_OPACITY = 0.7;
const USER_ROUTE_ZINDEX = 100;

interface UseItineraryGeoJsonRendererProps {
  map: any;
  isNaverLoadedParam: boolean;
  geoJsonLinksInput: GeoLink[]; // Renamed to avoid confusion with context
  mapPlacesWithGeoNodesFn: (places: CorePlace[]) => CorePlace[]; 
  addPolyline: (
    pathCoordinates: { lat: number; lng: number }[],
    color: string,
    weight?: number,
    opacity?: number,
    zIndex?: number
  ) => any | null;
  clearAllMapPolylines: () => void;
  itinerary: CoreItineraryDay[] | null; 
}

export const useItineraryGeoJsonRenderer = ({
  map,
  isNaverLoadedParam,
  mapPlacesWithGeoNodesFn,
  addPolyline,
  clearAllMapPolylines,
  itinerary, 
}: UseItineraryGeoJsonRendererProps) => {
  const { getLinkByLinkIdFromContext } = useGeoJsonContext();
  const { selectedMapDay, getDayRouteData, setDayRouteData } = useRouteMemoryStore();
  const [isRendering, setIsRendering] = useState(false);
  const { subscribe } = useEventEmitter();

  const renderFallbackRoute = useCallback((dayToRender: number) => {
    if (!map || !itinerary || !isNaverLoadedParam) return [];
    
    const currentDayItinerary = itinerary.find(d => d.day === dayToRender);
    if (!currentDayItinerary || !currentDayItinerary.places || currentDayItinerary.places.length < 2) {
      console.warn(`[ItineraryGeoJsonRenderer-Fallback] Not enough places for day ${dayToRender}.`);
      return [];
    }

    console.log(`[ItineraryGeoJsonRenderer-Fallback] Day ${dayToRender}: Drawing direct lines for ${currentDayItinerary.places.length} places.`);
    const mappedPlaces = mapPlacesWithGeoNodesFn(currentDayItinerary.places as CorePlace[]);
    const validPlaces = mappedPlaces.filter(p =>
        p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    const newPolylines: any[] = [];
    if (validPlaces.length > 1) {
        const pathCoordinates = validPlaces.map(p => ({ lat: p.y as number, lng: p.x as number }));
        const polyline = addPolyline(pathCoordinates, USER_ROUTE_COLOR, 3, USER_ROUTE_OPACITY - 0.1, USER_ROUTE_ZINDEX - 10);
        if (polyline) newPolylines.push(polyline);

        const naverCoords = pathCoordinates.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
        if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
    }
    return newPolylines;
  }, [map, itinerary, isNaverLoadedParam, mapPlacesWithGeoNodesFn, addPolyline]);


  const renderItineraryRouteForDay = useCallback(async (dayToRender: number, onComplete?: () => void) => {
    if (!map || !isNaverLoadedParam) {
      console.log('[ItineraryGeoJsonRenderer] Map not ready for day', dayToRender);
      if (onComplete) onComplete();
      return;
    }
   
    setIsRendering(true);
    clearAllMapPolylines(); 

    const dayData = getDayRouteData(dayToRender);

    if (!dayData || !dayData.linkIds || dayData.linkIds.length === 0) {
      console.warn(`[ItineraryGeoJsonRenderer] No linkIds for day ${dayToRender}. Using fallback.`);
      const fallbackPolylines = renderFallbackRoute(dayToRender);
      setDayRouteData(dayToRender, { polylines: fallbackPolylines });
      setIsRendering(false);
      if (onComplete) onComplete();
      return;
    }
    
    try {
      const { linkIds } = dayData;
      console.log(`[ItineraryGeoJsonRenderer] Rendering GeoJSON route for day ${dayToRender}: ${linkIds.length} link IDs.`);

      if (getLinkByLinkIdFromContext === undefined) {
        console.warn('[ItineraryGeoJsonRenderer] getLinkByLinkIdFromContext is undefined.');
      }

      const allRouteCoordinatesForBounds: { lat: number; lng: number }[][] = [];
      let missingLinkCount = 0;
      const newPolylines: any[] = [];

      for (const linkIdInput of linkIds) {
        const stringLinkIdToFind = String(linkIdInput).trim();
        const linkFeature = getLinkByLinkIdFromContext ? getLinkByLinkIdFromContext(stringLinkIdToFind) : null;

        if (linkFeature?.geometry?.type === 'LineString' && Array.isArray(linkFeature.geometry.coordinates)) {
          const coords = linkFeature.geometry.coordinates as GeoCoordinates[];
          const pathCoordsForPolyline = coords.map((coordPair: GeoCoordinates) => {
            if (coordPair && typeof coordPair[0] === 'number' && typeof coordPair[1] === 'number') {
              return { lat: coordPair[1], lng: coordPair[0] };
            }
            return null;
          }).filter(c => c !== null) as { lat: number; lng: number }[];

          if (pathCoordsForPolyline.length >= 2) {
            const polyline = addPolyline(pathCoordsForPolyline, USER_ROUTE_COLOR, USER_ROUTE_WEIGHT, USER_ROUTE_OPACITY, USER_ROUTE_ZINDEX);
            if (polyline) {
              newPolylines.push(polyline);
              allRouteCoordinatesForBounds.push(pathCoordsForPolyline);
            }
          }
        } else {
          missingLinkCount++;
        }
      }
      
      setDayRouteData(dayToRender, { polylines: newPolylines }); 
      console.log(`[ItineraryGeoJsonRenderer] Day ${dayToRender} route: ${newPolylines.length} polylines. Missing: ${missingLinkCount}.`);

      if (allRouteCoordinatesForBounds.length > 0) {
        const flatCoordsForBounds = allRouteCoordinatesForBounds.flat();
        const naverCoords = flatCoordsForBounds.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
        if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
      } else if (linkIds.length > 0) { // All links were missing or invalid
         console.warn(`[ItineraryGeoJsonRenderer] Day ${dayToRender}: All links missing/invalid. Fallback to place bounds.`);
         const fallbackPolylines = renderFallbackRoute(dayToRender); 
         if (fallbackPolylines.length > 0) {
            setDayRouteData(dayToRender, { polylines: fallbackPolylines });
         } else {
            const currentDayStoreData = getDayRouteData(dayToRender);
            if (currentDayStoreData?.places && currentDayStoreData.places.length > 0) {
                const validPlacesCoords = currentDayStoreData.places
                    .filter(p => p.y != null && p.x != null && !isNaN(Number(p.y)) && !isNaN(Number(p.x)))
                    .map(p => ({ lat: p.y as number, lng: p.x as number }));
                if (validPlacesCoords.length > 0) {
                    const naverCoords = validPlacesCoords.map(c => createNaverLatLng(c.lat, c.lng)).filter(p => p !== null) as any[];
                    if (naverCoords.length > 0) fitBoundsToCoordinates(map, naverCoords);
                }
            }
         }
      }
    } catch (error) {
      console.error(`[ItineraryGeoJsonRenderer] Error rendering route for day ${dayToRender}:`, error);
    } finally {
      setIsRendering(false);
      if (onComplete) onComplete();
    }
  }, [
      map, isNaverLoadedParam, addPolyline, clearAllMapPolylines,
      getLinkByLinkIdFromContext, getDayRouteData, setDayRouteData,
      itinerary, renderFallbackRoute 
  ]);
  
  useEffect(() => {
    console.log(`[ItineraryGeoJsonRenderer] Listening to selectedMapDay: ${selectedMapDay}. Triggering route render.`);
    renderItineraryRouteForDay(selectedMapDay);
  }, [selectedMapDay, renderItineraryRouteForDay]); // renderItineraryRouteForDay should be stable if its deps are

  useEffect(() => {
    const handleMapDayChanged = (eventData: { day: number }) => {
      if (eventData && typeof eventData.day === 'number') {
        console.log(`[ItineraryGeoJsonRenderer] 'mapDayChanged' event for day ${eventData.day}.`);
        if (eventData.day !== selectedMapDay) { // Only if different from current store state to avoid loop with above effect
             renderItineraryRouteForDay(eventData.day);
        }
      }
    };
    const unsubscribe = subscribe<{day: number}>('mapDayChanged', handleMapDayChanged);
    return () => unsubscribe();
  }, [subscribe, renderItineraryRouteForDay, selectedMapDay]);

  return { renderExternalTriggeredRoute: renderItineraryRouteForDay, isRendering };
};
