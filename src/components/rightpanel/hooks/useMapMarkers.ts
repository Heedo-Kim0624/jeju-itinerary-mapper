
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMapContext } from '../MapContext';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { clearMarkers as clearMarkersUtil } from '@/utils/map/mapCleanup';

import { useMarkerRefs } from './marker-utils/useMarkerRefs'; // Keep if general marker refs are still useful
import { useMarkerUpdater } from './marker-utils/useMarkerUpdater';
// import { useMarkerEventListeners } from './marker-utils/useMarkerEventListeners'; // May need adjustment
import { useMarkerRenderLogic } from './marker-utils/useMarkerRenderLogic'; // This will be heavily adapted
// import { useMarkerLifecycleManager } from './marker-utils/useMarkerLifecycleManager'; // May need adjustment

import { useRouteMemoryStore } from '@/hooks/map/useRouteMemoryStore';
import { EventEmitter } from '@/hooks/events/useEventEmitter';

interface UseMapMarkersProps {
  places: Place[]; 
  selectedPlace: Place | null; 
  itinerary: ItineraryDay[] | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
}

export const useMapMarkers = (props: UseMapMarkersProps) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const {
    itinerary,
    onPlaceClick,
    highlightPlaceId,
  } = props;

  // Zustand store for day-specific data
  const { 
    selectedDay, 
    getDayRouteData, 
    setDayRouteData,
    // clearDayMarkers: clearDayMarkersFromStore // 존재하지 않는 속성 제거
  } = useRouteMemoryStore();

  const { markersRef: generalMarkersRef } = useMarkerRefs(); // For non-itinerary markers
  const [currentDayMarkers, setCurrentDayMarkers] = useState<any[]>([]);


  const clearAllCurrentDayMarkersFromMap = useCallback(() => {
    // Clear markers associated with the *currently selected day* from the map
    const dayData = getDayRouteData(selectedDay);
    if (dayData && dayData.markers) {
      dayData.markers.forEach(m => {
        if (m && typeof m.setMap === 'function') {
            m.setMap(null);
        }
      });
    }
    // Also clear any locally tracked currentDayMarkers if they haven't made it to store yet
    currentDayMarkers.forEach(m => {
        if (m && typeof m.setMap === 'function') {
            m.setMap(null);
        }
    });
    setCurrentDayMarkers([]);
  }, [selectedDay, getDayRouteData, currentDayMarkers]);


  // This is the core marker rendering logic for the selected itinerary day
  const renderMarkersForSelectedDay = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !itinerary || selectedDay === null) {
      console.log('[useMapMarkers] Conditions not met for rendering day markers.');
      clearAllCurrentDayMarkersFromMap(); // Clear if conditions are not met
      return;
    }

    clearAllCurrentDayMarkersFromMap(); // Clear previous markers for the day

    const dayDataFromStore = getDayRouteData(selectedDay);
    let newMarkersForDay: any[] = [];

    // Check if markers are already created and stored for this day
    if (dayDataFromStore && dayDataFromStore.markers && dayDataFromStore.markers.length > 0) {
      console.log(`[useMapMarkers] Reusing ${dayDataFromStore.markers.length} markers for day ${selectedDay} from store.`);
      newMarkersForDay = dayDataFromStore.markers;
      newMarkersForDay.forEach(marker => {
        if (marker && typeof marker.setMap === 'function') {
          marker.setMap(map); // Add them back to map
        }
      });
    } else {
      // Markers not in store, create them
      const currentItineraryDay = itinerary.find(d => d.day === selectedDay);
      if (currentItineraryDay && currentItineraryDay.places) {
        console.log(`[useMapMarkers] Creating ${currentItineraryDay.places.length} new markers for day ${selectedDay}.`);
        currentItineraryDay.places.forEach((place: ItineraryPlaceWithTime, index: number) => {
          if (place.y != null && place.x != null && window.naver && window.naver.maps) {
            const position = new window.naver.maps.LatLng(place.y, place.x);
            // TODO: 마커 스타일링 및 아이콘 적용 (이전 코드 참조 또는 새로운 스타일 정의)
            const markerOptions: any = {
              position,
              map,
              title: place.name,
              // 예시: itinerary 마커 스타일 적용
              icon: {
                content: `<div style="width:24px;height:24px;background-color:blue;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;">${index + 1}</div>`,
                anchor: new window.naver.maps.Point(12, 12),
              }
            };
            
            // highlightPlaceId와 일치하는 경우 마커 스타일 변경
            if (highlightPlaceId && place.id === highlightPlaceId) {
                markerOptions.icon = { // 강조 스타일
                    content: `<div style="width:30px;height:30px;background-color:red;color:white;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:bold;border:2px solid white;box-shadow:0 0 5px red;">${index + 1}</div>`,
                    anchor: new window.naver.maps.Point(15, 15),
                };
                markerOptions.zIndex = 100; // 강조 마커를 위로
            }

            const marker = new window.naver.maps.Marker(markerOptions);

            if (onPlaceClick) {
              window.naver.maps.Event.addListener(marker, 'click', () => {
                onPlaceClick(place, index);
              });
            }
            newMarkersForDay.push(marker);
          }
        });
        // Store newly created markers
        setDayRouteData(selectedDay, { markers: newMarkersForDay });
      } else {
         console.log(`[useMapMarkers] No places found in itinerary for day ${selectedDay}.`);
      }
    }
    setCurrentDayMarkers(newMarkersForDay);
    
    // Fit bounds to new markers if any
    if (newMarkersForDay.length > 0 && window.naver && window.naver.maps) {
        const bounds = new window.naver.maps.LatLngBounds();
        newMarkersForDay.forEach(marker => {
            if(marker && marker.getPosition) { // Marker가 유효하고 getPosition 메소드가 있는지 확인
                bounds.extend(marker.getPosition());
            }
        });
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
        }
    }

  }, [map, isMapInitialized, isNaverLoaded, itinerary, selectedDay, getDayRouteData, setDayRouteData, onPlaceClick, highlightPlaceId, clearAllCurrentDayMarkersFromMap]);

  // Effect to re-render markers when selectedDay (from store) changes or map is ready
  useEffect(() => {
    if (isMapInitialized) {
        console.log(`[useMapMarkers] Selected day changed to ${selectedDay} or map ready. Rendering day markers.`);
        renderMarkersForSelectedDay();
    }
  }, [selectedDay, isMapInitialized, renderMarkersForSelectedDay, itinerary, highlightPlaceId]); // itinerary, highlightPlaceId 추가

  // Event listener for explicit 'mapDayChanged' events
  useEffect(() => {
    const handleMapDayChanged = (eventData: unknown) => { // eventData 타입을 unknown으로 변경하여 유연성 확보
        const day = (eventData as { detail?: { day?: number }; day?: number })?.detail?.day ?? (eventData as { day?: number })?.day;
        if (typeof day === 'number') {
            console.log(`[useMapMarkers] 'mapDayChanged' event received for day ${day}. Triggering re-render.`);
            // The selectedDay from store should already be updated by useMapDaySelector.
            // This effect primarily ensures renderMarkersForSelectedDay is called if map is initialized.
            if (isMapInitialized) {
                renderMarkersForSelectedDay();
            }
        } else {
            console.warn('[useMapMarkers] mapDayChanged event received with invalid data:', eventData);
        }
    };
    
    const unsubscribe = EventEmitter.subscribe('mapDayChanged', handleMapDayChanged);
    return () => unsubscribe();
  }, [isMapInitialized, renderMarkersForSelectedDay]);


  // Clear all markers on component unmount or when map is destroyed
  useEffect(() => {
    return () => {
      console.log("[useMapMarkers] Unmounting, clearing current day markers from map.");
      clearAllCurrentDayMarkersFromMap();
    };
  }, [clearAllCurrentDayMarkersFromMap]);


  const forceMarkerUpdate = useCallback(() => {
    console.log("[useMapMarkers] forceMarkerUpdate called. Re-rendering markers for current day.");
    renderMarkersForSelectedDay();
  }, [renderMarkersForSelectedDay]);

  const clearAllMarkersAndStore = useCallback(() => {
     console.log("[useMapMarkers] Clearing all markers from map and store.");
     const store = useRouteMemoryStore.getState();
     store.routeDataByDay.forEach((_dayData, dayIdx) => {
        const dayRouteD = store.getDayRouteData(dayIdx);
        if (dayRouteD && dayRouteD.markers) {
          dayRouteD.markers.forEach(m => {
            if (m && typeof m.setMap === 'function') {
              m.setMap(null);
            }
          });
        }
        store.setDayRouteData(dayIdx, { markers: [] }); // 스토어에서도 마커 정보 제거
     });
     setCurrentDayMarkers([]); // 로컬 상태도 초기화
  }, []); // 의존성 배열에서 getDayRouteData, setDayRouteData 제거 (getState 사용)

  return {
    clearAllMarkers: clearAllMarkersAndStore, 
    forceMarkerUpdate,
  };
};
