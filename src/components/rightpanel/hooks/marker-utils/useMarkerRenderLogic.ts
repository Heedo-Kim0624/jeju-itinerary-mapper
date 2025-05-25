
import { useCallback, useRef } from 'react';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';
import { getMarkerIconOptions, createNaverMarker } from '@/utils/map/markerUtils';
import { createNaverLatLng } from '@/utils/map/mapSetup';
import { fitBoundsToPlaces, panToPosition } from '@/utils/map/mapViewControls';
import { clearMarkers as clearMarkersUtil, clearInfoWindows as clearInfoWindowsUtil } from '@/utils/map/mapCleanup'; // clearInfoWindowsUtil 추가

interface MarkerRenderLogicProps {
  places: Place[]; // 일반 검색 결과 또는 기본 장소 목록
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
  // 이전 확대/축소 및 중심 좌표 저장용 Ref
  const userHasInteractedWithMapRef = useRef(false);

  // 사용자가 지도를 조작했는지 감지하는 이벤트 리스너 설정
  if (map && isMapInitialized) {
    window.naver.maps.Event.addListener(map, 'dragstart', () => {
      userHasInteractedWithMapRef.current = true;
    });
    window.naver.maps.Event.addListener(map, 'zoom_changed', () => {
      userHasInteractedWithMapRef.current = true;
    });
     window.naver.maps.Event.addListener(map, 'mousedown', () => { // for panning
      userHasInteractedWithMapRef.current = true;
    });
  }


  const renderMarkers = useCallback(() => {
    if (!map || !isMapInitialized || !isNaverLoaded || !window.naver || !window.naver.maps) {
      console.log("[useMarkerRenderLogic] Map not initialized or Naver not loaded, cannot render markers.");
      return;
    }

    // 기존 마커 및 정보창 모두 제거
    if (markersRef.current.length > 0) {
      console.log(`[useMarkerRenderLogic] Clearing ${markersRef.current.length} existing markers.`);
      markersRef.current = clearMarkersUtil(markersRef.current);
    }
    if (infoWindowsRef.current.length > 0) {
      console.log(`[useMarkerRenderLogic] Clearing ${infoWindowsRef.current.length} existing info windows.`);
      infoWindowsRef.current = clearInfoWindowsUtil(infoWindowsRef.current);
    }

    let placesToDisplay: (Place | ItineraryPlaceWithTime)[] = [];
    let isDisplayingItineraryDay = false;

    console.log(`[useMarkerRenderLogic] Determining places to display: selectedDay=${selectedDay}, itinerary items=${itinerary?.length || 0}, general places=${places.length}`);

    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[useMarkerRenderLogic] Displaying ITINERARY for day ${selectedDay}: ${placesToDisplay.length} places.`);
        userHasInteractedWithMapRef.current = false; // 일자 변경 시 자동 뷰 조정을 위해 리셋
      } else {
        placesToDisplay = [];
        console.log(`[useMarkerRenderLogic] No ITINERARY places for day ${selectedDay} or day data missing. Displaying 0 markers.`);
      }
    } else if (selectedDay === null && places.length > 0) {
      placesToDisplay = places;
      isDisplayingItineraryDay = false;
      console.log(`[useMarkerRenderLogic] No active itinerary day. Displaying ${places.length} GENERAL places.`);
      userHasInteractedWithMapRef.current = false; // 일반 장소 표시 시 자동 뷰 조정을 위해 리셋
    } else {
      placesToDisplay = [];
      console.log("[useMarkerRenderLogic] No itinerary day selected AND no general places. Displaying 0 markers.");
    }

    if (placesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No places to display. Map will be empty of these markers.");
      return;
    }

    const validPlacesToDisplay = placesToDisplay.filter(p =>
      p.x != null && p.y != null && !isNaN(Number(p.x)) && !isNaN(Number(p.y))
    );

    if (validPlacesToDisplay.length === 0) {
      console.log("[useMarkerRenderLogic] No valid coordinates found. Map will be empty of these markers.");
      return;
    }

    console.log(`[useMarkerRenderLogic] Creating ${validPlacesToDisplay.length} new markers. Mode: ${isDisplayingItineraryDay ? 'Itinerary' : 'General'}`);
    const newMarkers: naver.maps.Marker[] = [];
    const newInfoWindows: naver.maps.InfoWindow[] = [];

    validPlacesToDisplay.forEach((place, index) => {
      if (!window.naver || !window.naver.maps) return;

      const position = createNaverLatLng(place.y!, place.x!);
      if (!position) return;
      
      const isGloballySelectedCandidate = selectedPlaces.some(sp => sp.id === place.id);
      const isInfoWindowTargetGlobal = selectedPlace?.id === place.id; // 전역 selectedPlace (정보 패널 연동용)
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
        <div style="padding:10px;min-width:150px;line-height:1.5;">
          <h4 style="margin-top:0;font-weight:bold;font-size:14px;">${place.name}</h4>
          ${place.address ? `<p style="margin:0;font-size:12px;color:#555;">${place.address}</p>` : ''}
          ${(place as ItineraryPlaceWithTime).category ? `<p style="margin:2px 0 0;font-size:11px;color:#007bff;">${(place as ItineraryPlaceWithTime).category}</p>` : ''}
        </div>`;
      
      const infoWindow = new window.naver.maps.InfoWindow({
        content: infoWindowContent,
        maxWidth: 300,
        backgroundColor: "#fff",
        borderColor: "#ccc",
        borderWidth: 1,
        anchorSize: new window.naver.maps.Size(10, 10),
        anchorSkew: true,
        anchorColor: "#fff",
        pixelOffset: new window.naver.maps.Point(0, -iconOptions.size!.height / 2 -10)
      });

      newInfoWindows.push(infoWindow);

      if (window.naver && window.naver.maps && window.naver.maps.Event) {
        window.naver.maps.Event.addListener(marker, 'click', () => {
          // 다른 정보창 닫기
          infoWindowsRef.current.forEach(iw => iw.close());
          // 현재 정보창 열기
          if (infoWindow.getMap()) {
            infoWindow.close();
          } else {
            infoWindow.open(map, marker);
          }
          // onPlaceClick은 여전히 호출하여 다른 로직(예: 사이드 패널 업데이트) 실행 가능
          if (onPlaceClick) {
            onPlaceClick(place, index);
          }
        });
      }
      
      newMarkers.push(marker);
    });
    
    markersRef.current = newMarkers;
    infoWindowsRef.current = newInfoWindows;
    console.log(`[useMarkerRenderLogic] ${newMarkers.length} markers and ${newInfoWindows.length} info windows added.`);

    // 지도 뷰 조정: 사용자가 직접 지도를 조작하지 않았을 경우에만 실행
    if (!userHasInteractedWithMapRef.current && newMarkers.length > 0) {
      const placeToFocus = selectedPlace || (highlightPlaceId ? validPlacesToDisplay.find(p => p.id === highlightPlaceId) : null);

      if (placeToFocus && placeToFocus.y != null && placeToFocus.x != null) {
        console.log(`[useMarkerRenderLogic] Panning to focused place: ${placeToFocus.name}`);
        if (map.getZoom() < 15) map.setZoom(15, true);
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else {
        console.log(`[useMarkerRenderLogic] Fitting map bounds to ${isDisplayingItineraryDay ? 'itinerary' : 'general'} markers.`);
        fitBoundsToPlaces(map, validPlacesToDisplay as Place[]);
      }
    } else if (newMarkers.length > 0) {
        console.log(`[useMarkerRenderLogic] User has interacted with map, skipping automatic bounds fitting.`);
    }

  }, [
    map, isMapInitialized, isNaverLoaded, markersRef, infoWindowsRef, userHasInteractedWithMapRef,
    places, selectedPlace, itinerary, selectedDay, selectedPlaces,
    onPlaceClick, highlightPlaceId,
  ]);

  return { renderMarkers };
};
