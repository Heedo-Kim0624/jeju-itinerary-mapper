import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { useMarkerRenderLogic } from './hooks/marker-utils/useMarkerRenderLogic';
import { useMapContext } from './MapContext';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

interface MapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places: allPlaces, 
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
}) => {
  const loggingPrefix = useMemo(() => `[MapMarkers Day ${selectedDay ?? 'N/A'}]`, [selectedDay]);
  // console.log(`${loggingPrefix} Render/Update. Highlight: ${highlightPlaceId}`);

  const { 
    map, 
    isMapInitialized, 
    isNaverLoaded,
    handleMarkerRenderingCompleteForContext, // MapContext에서 제공
    currentRenderingDay // MapContext에서 제공
  } = useMapContext();
  
  const markersRef = useRef<naver.maps.Marker[]>([]);
  
  const placesToRender = useMemo(() => {
    if (selectedDay !== null && itinerary) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData?.places?.length) {
        // console.log(`${loggingPrefix} Using ${currentDayData.places.length} places from itinerary for day ${selectedDay}.`);
        return currentDayData.places;
      }
      // console.log(`${loggingPrefix} Day ${selectedDay}: No places in itinerary or empty, returning empty array.`);
      return []; 
    }
    // console.log(`${loggingPrefix} No day selected or no itinerary, using ${allPlaces.length} general places.`);
    return allPlaces;
  }, [allPlaces, itinerary, selectedDay, loggingPrefix]);
  
  const { renderMarkers } = useMarkerRenderLogic({
    places: placesToRender,
    selectedPlace,
    itinerary,
    selectedDay,
    selectedPlaces,
    onPlaceClick,
    highlightPlaceId,
    markersRef,
    map,
    isMapInitialized,
    isNaverLoaded,
  });

  const clearSelfMarkers = useCallback(() => {
    if (markersRef.current.length > 0) {
      // console.log(`${loggingPrefix} Clearing ${markersRef.current.length} self-managed markers.`);
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
  }, [loggingPrefix]);
  
  useEffect(() => {
    const handleInternalRouteComplete = (event: Event) => {
      const customEvent = event as CustomEvent<{ day: number | null; source: string }>;
      // console.log(`${loggingPrefix} Received 'routeRenderingCompleteInternal' event for day ${customEvent.detail?.day} (source: ${customEvent.detail?.source}). Current component selectedDay: ${selectedDay}, MapContext currentRenderingDay: ${currentRenderingDay}`);
      
      // MapContext의 currentRenderingDay와 이 컴포넌트의 selectedDay가 일치할 때만 반응
      // 그리고 이벤트 소스가 'MapContext'인지 확인
      if (customEvent.detail?.source === 'MapContext' && customEvent.detail?.day === selectedDay && selectedDay === currentRenderingDay) {
        console.log(`${loggingPrefix} Event 'routeRenderingCompleteInternal' (day ${customEvent.detail.day}) received AND matches current selectedDay and currentRenderingDay. Rendering markers.`);
        if (isMapInitialized && isNaverLoaded) {
          clearSelfMarkers(); 
          renderMarkers(); 
          if (handleMarkerRenderingCompleteForContext) {
             console.log(`${loggingPrefix} Notifying MapContext: marker rendering complete for day ${selectedDay}.`);
             handleMarkerRenderingCompleteForContext(); 
          }
        } else {
          // console.log(`${loggingPrefix} Markers not rendered: Map not ready (isMapInitialized: ${isMapInitialized}, isNaverLoaded: ${isNaverLoaded})`);
        }
      } else {
        //  console.log(`${loggingPrefix} Ignored 'routeRenderingCompleteInternal'. DetailDay: ${customEvent.detail?.day}, SelectedDay: ${selectedDay}, CurrentRenderingDay: ${currentRenderingDay}, Source: ${customEvent.detail?.source}`);
      }
    };

    window.addEventListener('routeRenderingCompleteInternal', handleInternalRouteComplete);
    return () => {
      window.removeEventListener('routeRenderingCompleteInternal', handleInternalRouteComplete);
    };
  }, [isMapInitialized, isNaverLoaded, renderMarkers, clearSelfMarkers, handleMarkerRenderingCompleteForContext, selectedDay, loggingPrefix, currentRenderingDay]);


  useEffect(() => {
    const handleDayRenderingStarted = (event: Event) => {
        const customEvent = event as CustomEvent<{ day: number | null }>;
        // console.log(`${loggingPrefix} Event 'dayRenderingStarted' for day ${customEvent.detail.day}. SelectedDay: ${selectedDay}, CurrentRenderingDay(Context): ${currentRenderingDay}`);
        // MapContext에서 이미 글로벌 클리어를 수행했으므로, 여기서는 내부 마커 참조만 초기화
        // selectedDay가 바뀌었을 때, 이전 selectedDay에 대한 마커들이 남아있지 않도록.
        if (markersRef.current.length > 0) {
            // console.log(`${loggingPrefix} 'dayRenderingStarted' received. Clearing ${markersRef.current.length} self-managed markers for (presumably previous) day.`);
            markersRef.current = []; 
        }
    };
    window.addEventListener('dayRenderingStarted', handleDayRenderingStarted);
    return () => {
        window.removeEventListener('dayRenderingStarted', handleDayRenderingStarted);
    };
  }, [loggingPrefix, currentRenderingDay]); 

  useEffect(() => {
    return () => {
      // console.log(`${loggingPrefix} Component unmounting - clearing self markers.`);
      clearSelfMarkers();
    };
  }, [clearSelfMarkers, loggingPrefix]);

  return null; 
};

export default React.memo(MapMarkers, (prevProps, nextProps) => {
  const loggingPrefixFunc = (day: number | null) => `[MapMarkers.memo Day ${day ?? 'N/A'}]`;

  if (prevProps.selectedDay !== nextProps.selectedDay) {
    // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to selectedDay change: ${prevProps.selectedDay} -> ${nextProps.selectedDay}`);
    return false;
  }
  if (prevProps.selectedPlace?.id !== nextProps.selectedPlace?.id) {
    // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to selectedPlace change.`);
    return false;
  }
  if (prevProps.highlightPlaceId !== nextProps.highlightPlaceId) {
    // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to highlightPlaceId change.`);
    return false;
  }

  const getPlacesForDay = (props: MapMarkersProps) => {
    if (props.selectedDay !== null && props.itinerary) {
      const dayData = props.itinerary.find(d => d.day === props.selectedDay);
      return dayData?.places || [];
    }
    return props.places;
  };

  const prevRenderPlaces = getPlacesForDay(prevProps);
  const nextRenderPlaces = getPlacesForDay(nextProps);

  if (prevRenderPlaces.length !== nextRenderPlaces.length || 
      prevRenderPlaces.some((p, i) => p.id !== nextRenderPlaces[i]?.id || p.name !== nextRenderPlaces[i]?.name)) { // 이름 변경도 감지
    // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to derived placesToRender change.`);
    return false;
  }
  
  if (prevProps.selectedPlaces !== nextProps.selectedPlaces) { 
    if ((prevProps.selectedPlaces?.length || 0) !== (nextProps.selectedPlaces?.length || 0) ||
        prevProps.selectedPlaces?.some((p, i) => p.id !== nextProps.selectedPlaces?.[i]?.id)) {
      // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to selectedPlaces content change.`);
      return false;
    }
  }
  
  // Itinerary 자체가 변경되었는지 (예: routeId 변경 등) 확인
  if (prevProps.itinerary !== nextProps.itinerary) {
      // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Re-rendering due to itinerary object change.`);
      return false;
  }
  
  // console.log(`${loggingPrefixFunc(nextProps.selectedDay)} Skipping re-render.`);
  return true;
});
