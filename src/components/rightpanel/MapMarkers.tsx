
import React, { useEffect, useRef } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { addMarkersToMap, clearMarkers as clearDrawnMarkers, panToPosition, fitBoundsToPlaces, getMarkerIconOptions, createNaverMarker, createNaverLatLng } from '@/utils/map/mapDrawing';

interface MapMarkersProps {
  places: Place[]; // 일반 장소 목록 (검색 결과 등)
  selectedPlace: Place | null; // 사용자가 선택한 특정 장소 (정보 표시용)
  itinerary: ItineraryDay[] | null; // 전체 일정 데이터
  selectedDay: number | null; // 현재 선택된 날짜 (일)
  selectedPlaces?: Place[]; // 사용자가 좌측 패널에서 '선택'한 장소들
  onPlaceClick?: (place: Place, index: number) => void; // 마커 클릭 시 콜백
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick,
}) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<any[]>([]);

  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded) {
      console.log("[MapMarkers] 지도 미초기화 또는 Naver API 미로드. 마커 표시 건너뜀.");
      return;
    }

    console.log("[MapMarkers] 데이터 변경 감지", {
      placesCount: places.length,
      selectedPlaceExists: !!selectedPlace,
      itineraryDays: itinerary ? itinerary.length : 0,
      selectedDay: selectedDay,
      selectedPlacesCount: selectedPlaces.length
    });
    
    // 기존 마커 모두 제거
    clearDrawnMarkers(markersRef.current);
    markersRef.current = [];

    let placesToDisplay: Place[] = [];
    let isDisplayingItineraryDay = false;

    // 선택된 날짜가 있고 유효한 일정이 있는 경우 해당 일자의 장소들 표시
    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplay = currentDayData.places;
        isDisplayingItineraryDay = true;
        console.log(`[MapMarkers] 선택된 ${selectedDay}일차 일정 장소 ${placesToDisplay.length}개를 표시합니다.`);
      } else {
        console.log(`[MapMarkers] ${selectedDay}일차 데이터 또는 장소가 없어 일반 장소 마커를 표시합니다.`);
        placesToDisplay = places; // fallback to general places if day data is missing
      }
    } else {
      console.log("[MapMarkers] 선택된 날짜가 없거나 일정이 없어 일반 장소 마커를 표시합니다.");
      placesToDisplay = places; // No selected day or itinerary, show general places
    }
    
    console.log("[MapMarkers] 데이터 렌더링 시작");

    if (placesToDisplay.length > 0) {
      placesToDisplay.forEach((place, index) => {
        if (!place.y || !place.x) {
          console.warn(`[MapMarkers] 장소 '${place.name}'의 좌표가 없습니다. 마커를 생성하지 않습니다.`);
          return;
        }
        
        const position = createNaverLatLng(place.y, place.x);
        const isGloballySelected = selectedPlaces.some(sp => sp.id === place.id); // 좌측 패널에서 '선택'된 장소
        const isInfoWindowTarget = selectedPlace?.id === place.id; // 현재 정보창이 열릴 장소
        
        // 일정 일자 표시 중이면 빨간 점 마커, 그 외에는 일반 마커
        const iconOptions = getMarkerIconOptions(place, isInfoWindowTarget, !isDisplayingItineraryDay && isGloballySelected && !isInfoWindowTarget, isDisplayingItineraryDay);
        
        const marker = createNaverMarker(map, position, iconOptions, place.name);

        if (onPlaceClick) {
          window.naver.maps.Event.addListener(marker, 'click', () => {
            console.log(`[MapMarkers] 마커 클릭: ${place.name} (${index})`);
            onPlaceClick(place, index);
          });
        }
        markersRef.current.push(marker);
      });

      // 지도 범위 조정 (첫 로드 시에만)
      if (markersRef.current.length > 0 && !selectedPlace) {
        console.log("[MapMarkers] 마커에 맞게 지도 범위 조정");
        fitBoundsToPlaces(map, placesToDisplay);
      }
    } else {
      console.log("[MapMarkers] 표시할 장소가 없습니다.");
    }
    
    // 사용자가 명시적으로 선택한 장소 (selectedPlace)가 있다면 강조 (예: 다른 아이콘 또는 줌)
    if (selectedPlace && !isDisplayingItineraryDay) { // 일정 표시 중에는 selectedPlace에 의한 마커 변경은 무시할 수 있음
      if (selectedPlace.y && selectedPlace.x) {
        console.log(`[MapMarkers] 선택된 장소로 이동: ${selectedPlace.name}`);
        if (map.getZoom() < 15) map.setZoom(15); // 선택된 장소 보기 좋게 줌
        panToPosition(map, selectedPlace.y, selectedPlace.x);
      } else {
        console.warn(`[MapMarkers] 선택된 장소 '${selectedPlace.name}'의 좌표가 없습니다.`);
      }
    }

    // 맵 센터링 - itinerary가 있고 selectedDay가 있지만 selectedPlace가 없는 경우
    if (itinerary && itinerary.length > 0 && selectedDay !== null && !selectedPlace) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        console.log(`[MapMarkers] 선택된 ${selectedDay}일차 일정 장소들에 맞게 지도 범위 조정`);
        fitBoundsToPlaces(map, currentDayData.places);
      }
    }

    return () => {
      // 컴포넌트 언마운트 시 클린업은 수행하지 않음
      // 다른 컴포넌트에서 마커를 사용할 수 있으므로
    };
  }, [map, isMapInitialized, isNaverLoaded, places, selectedPlace, itinerary, selectedDay, selectedPlaces, onPlaceClick]);

  return null; // 이 컴포넌트는 UI를 직접 렌더링하지 않고 지도에 마커만 추가합니다.
};

export default MapMarkers;
