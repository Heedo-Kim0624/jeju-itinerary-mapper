
import { useCallback, useRef, useEffect } from 'react'; // useEffect 추가
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil, clearInfoWindows as clearInfoWindowsUtil } from '@/utils/map/mapCleanup';

interface MarkerRenderLogicProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place | ItineraryPlaceWithTime, index: number) => void;
  highlightPlaceId?: string;
  markersRef: React.MutableRefObject<naver.maps.Marker[]>;
  map: any;
  isMapInitialized: boolean;
  isNaverLoaded: boolean;
}

export const useMarkerRenderLogic = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
  highlightPlaceId,
  markersRef,
  map,
  isMapInitialized,
  isNaverLoaded,
}: MarkerRenderLogicProps) => {
  const infoWindowsRef = useRef<naver.maps.InfoWindow[]>([]);
  const userHasInteractedWithMapRef = useRef(false);
  const prevSelectedDayRef = useRef<number | null>(null); // 일자 변경 감지용
  const prevPlacesLengthRef = useRef<number>(0); // 일반 장소 목록 변경 감지용

  useEffect(() => {
    if (map && isMapInitialized && window.naver?.maps?.Event) {
      const dragListener = window.naver.maps.Event.addListener(map, 'dragstart', () => {
        userHasInteractedWithMapRef.current = true;
        console.log("[useMarkerRenderLogic] Map dragstart, userHasInteractedWithMapRef set to true.");
      });
      const zoomListener = window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
        userHasInteractedWithMapRef.current = true;
        console.log("[useMarkerRenderLogic] Map zoom_changed, userHasInteractedWithMapRef set to true.");
      });
      const mousedownListener = window.naver.maps.Event.addListener(map, 'mousedown', () => {
        userHasInteractedWithMapRef.current = true;
        console.log("[useMarkerRenderLogic] Map mousedown, userHasInteractedWithMapRef set to true.");
      });
      return () => {
        window.naver.maps.Event.removeListener(dragListener);
        window.naver.maps.Event.removeListener(zoomListener);
        window.naver.maps.Event.removeListener(mousedownListener);
      };
    }
  }, [map, isMapInitialized]);

  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.warn("[useMarkerRenderLogic] Map not initialized or Naver not loaded, cannot render markers.");
      return;
    }

    console.log(`[useMarkerRenderLogic] Initiating renderMarkers. Current selectedDay: ${selectedDay}, Previous selectedDay: ${prevSelectedDayRef.current}`);

    if (markersRef.current.length > 0) {
      // console.log(`[useMarkerRenderLogic] Clearing ${markersRef.current.length} existing markers.`); // 로그 빈도 줄임
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
    if (infoWindowsRef.current.length > 0) {
      // console.log(`[useMarkerRenderLogic] Clearing ${infoWindowsRef.current.length} existing info windows.`); // 로그 빈도 줄임
      infoWindowsRef.current = clearInfoWindowsUtil(infoWindowsRef.current);
    }

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;
    let viewResetNeeded = false;

    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        if (prevSelectedDayRef.current !== selectedDay) {
          console.log(`[useMarkerRenderLogic] Day changed from ${prevSelectedDayRef.current} to ${selectedDay}. Resetting map view interaction.`);
          userHasInteractedWithMapRef.current = false;
          viewResetNeeded = true;
        }
        console.log(`[useMarkerRenderLogic] Displaying ITINERARY for day ${selectedDay}: ${placesToDisplay.length} places.`);
      } else {
        placesToDisplay = [];
        console.log(`[useMarkerRenderLogic] No ITINERARY places for day ${selectedDay} or day data missing.`);
      }
    } else if (selectedDay === null && places.length > 0) {
      placesToDisplay = places;
      isDisplayingItineraryDay = false;
      if (prevSelectedDayRef.current !== null || prevPlacesLengthRef.current !== places.length) {
         console.log(`[useMarkerRenderLogic] Switched to general places or general places changed. Resetting map view interaction.`);
         userHasInteractedWithMapRef.current = false;
         viewResetNeeded = true;
      }
      console.log(`[useMarkerRenderLogic] Displaying ${places.length} GENERAL places.`);
    } else {
      placesToDisplay = [];
      console.log("[useMarkerRenderLogic] No itinerary day selected AND no general places. Displaying 0 markers.");
       if (prevSelectedDayRef.current !== null || prevPlacesLengthRef.current > 0) { // Previously had something
        userHasInteractedWithMapRef.current = false; // Reset view if map becomes empty
        viewResetNeeded = true;
      }
    }
    
    prevSelectedDayRef.current = selectedDay;
    prevPlacesLengthRef.current = places.length;


    if (placesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No places to display. Map will be empty of these markers.");
      // 지도 뷰 조정 로직은 아래에서 처리
    }

    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0 && placesToDisplay.length > 0) {
      console.warn("[useMarkerRenderLogic] Some places to display but none have valid coordinates.");
    }


    console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} new markers. Mode: ${isDisplayingItineraryDay ? 'Itinerary' : 'General'}`);
    const newMarkers: naver.maps.Marker[] = [];
    const newInfoWindows: naver.maps.InfoWindow[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTargetGlobal = selectedPlace?.id === place.id;
      const isGeneralHighlightTarget = highlightPlaceId === place.id;
      
      const iconOptions = getMarkerIconOptions(
        place,
        isInfoWindowTargetGlobal || isGeneralHighlightTarget,
        isGloballySelectedCandidate && !isInfoWindowTargetGlobal && !isGeneralHighlightTarget,
        isDisplayingItineraryDay,
        isDisplayingItineraryDay ? index + 1 : undefined
      );
      
      let zIndex = 50;
      if (isDisplayingItineraryDay) zIndex = 150 - index;
      if (isInfoWindowTargetGlobal || isGeneralHighlightTarget) zIndex = 200;

      const marker = createNaverMarker(map, position, iconOptions, place.name, true, true, zIndex);
      if (!marker) return;

      const infoWindowContent = `
        <div style="padding:10px;min-width:180px;max-width:250px;line-height:1.5;font-size:12px;">
          <strong style="font-size:14px;display:block;margin-bottom:4px;">${place.name || '이름 없음'}</strong>
          ${place.address ? `<p style="margin:0 0 2px;color:#333;">${place.address}</p>` : ''}
          ${(place as ItineraryPlaceWithTime).category ? `<p style="margin:0;font-size:11px;color:#007bff;font-style:italic;">${(place as ItineraryPlaceWithTime).category}</p>` : ''}
          ${isDisplayingItineraryDay ? `<p style="margin-top:4px;font-size:11px;color:#555;">일정 순서: ${index + 1}</p>` : ''}
        </div>`;
      
      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoWindowContent,
        maxWidth: 280,
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        anchorSize: new window.naver.maps.Size(10, 10),
        anchorSkew: true,
        anchorColor: "#fff",
        pixelOffset: new window.naver.maps.Point(0, - (iconOptions.size?.height || 32) / 2 -10)
      });

      newInfoWindows.push(infoWindow);

      if (window.naver?.maps?.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          infoWindowsRef.current.forEach(iw => {
            if (iw !== infoWindow) iw.close();
          });
          
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
          
          if (onPlaceClick) {
            onPlaceClick(place, index);
          }
        });
      }
      
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows;
    // console.log(`[useMarkerRenderLogic] ${newMarkers.length} markers and ${newInfoWindows.length} info windows added.`); // 로그 빈도 줄임

    if (viewResetNeeded || (!userHasInteractedWithMapRef.current && newMarkers.length > 0)) {
      if (newMarkers.length === 0) {
        // 마커가 없으면 기본 뷰 (예: 제주도 전체)로 설정하거나 현재 뷰 유지
        // map.setZoom(9, true); // 예시: 기본 줌 레벨
        // map.setCenter(createNaverLatLng(33.361667, 126.529167)); // 예시: 제주도 중심
        console.log("[useMarkerRenderLogic] No markers to display, map view unchanged or reset to default if needed.");
      } else {
        const placeToFocus = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

        if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
          console.log(`[useMarkerRenderLogic] Panning to focused place: ${placeToFocus.name}`);
          if (map.getZoom() < 15) map.setZoom(15, true); // 최소 줌 레벨 보장
          panToPosition(map, placeToFocus.y, placeToFocus.x);
        } else {
          console.log(`[useMarkerRenderLogic] Fitting map bounds to ${validPlacesToDisplay.length} markers. User interaction: ${userHasInteractedWithMapRef.current}, View reset: ${viewResetNeeded}`);
          fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
        }
      }
    } else if (newMarkers.length > 0) {
        console.log(`[useMarkerRenderLogic] User has interacted with map OR no view reset needed, skipping automatic bounds fitting. User interaction: ${userHasInteractedWithMapRef.current}, View reset: ${viewResetNeeded}`);
    }

  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, infoWindowsRef, userHasInteractedWithMapRef, // userHasInteractedWithMapRef는 내부 ref이므로 의존성에 없어도 될 수 있으나, 안전하게 포함
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId, // prevSelectedDayRef, prevPlacesLengthRef는 useCallback의 의존성이 아님
  ]);

  return { renderMarkers };
};

