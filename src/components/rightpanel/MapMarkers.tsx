
import React, { useEffect, useRef } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { addMarkersToMap, clearMarkers as clearDrawnMarkers, panToPosition, fitBoundsToPlaces, getMarkerIconOptions, createNaverMarker, createNaverLatLng } from '@/utils/map/mapDrawing';
import { useMapFeatures } from '@/hooks/map/useMapFeatures'; // Import useMapFeatures

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place, index: number) => void;
  highlightPlaceId?: string; // For highlighting a specific marker
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace, // This is for info window target, not general highlighting
  itinerary,
  selectedDay,
  selectedPlaces = [], // These are "favorited" or "added to cart" places
  onPlaceClick,
  highlightPlaceId, // This prop can be used to highlight a marker from search results
}) => {
  const { map, isMapInitialized, isNaverLoaded } = useMapContext();
  const markersRef = useRef<any[]>([]);
  const { addMarkers: addMarkersFromFeatures, clearMarkersAndUiElements } = useMapFeatures(map, isNaverLoaded);


  useEffect(() => {
    if (!map || !isMapInitialized || !isNaverLoaded) {
      console.log("[MapMarkers] 지도 미초기화 또는 Naver API 미로드. 마커 표시 건너뜀.");
      return;
    }

    console.log("[MapMarkers] 데이터 변경 감지", {
      placesCount: places?.length || 0,
      selectedPlaceForInfoWindow: !!selectedPlace, // InfoWindow Target
      highlightPlaceIdFromProps: highlightPlaceId, // General Highlight Target
      itineraryDays: itinerary ? itinerary.length : 0,
      selectedDay: selectedDay,
      globallySelectedPlacesCount: selectedPlaces.length
    });
    
    // 기존 마커 모두 제거 (useMapFeatures의 clearMarkersAndUiElements 사용 또는 직접 markersRef 관리)
    clearDrawnMarkers(markersRef.current); // Clears markers stored in markersRef
    markersRef.current = [];

    let placesToDisplayOnMap: Place[] = [];
    let isDisplayingItineraryDayMode = false;

    if (selectedDay !== null && itinerary && itinerary.length > 0) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      
      if (currentDayData && currentDayData.places && currentDayData.places.length > 0) {
        placesToDisplayOnMap = currentDayData.places;
        isDisplayingItineraryDayMode = true;
        console.log(`[MapMarkers] 선택된 ${selectedDay}일차 일정 장소 ${placesToDisplayOnMap.length}개를 표시합니다.`, placesToDisplayOnMap.map(p=>({name: p.name, x:p.x, y:p.y, id: p.id})));
      } else {
        console.log(`[MapMarkers] ${selectedDay}일차 데이터 또는 장소가 없어 일반 장소 마커를 표시합니다.`);
        placesToDisplayOnMap = places || []; 
      }
    } else {
      console.log("[MapMarkers] 선택된 날짜가 없거나 일정이 없어 일반 장소 마커를 표시합니다.");
      placesToDisplayOnMap = places || [];
    }
    
    console.log("[MapMarkers] 데이터 렌더링 시작. 표시할 장소 수:", placesToDisplayOnMap.length);

    if (placesToDisplayOnMap.length > 0) {
      // Filter out places with invalid coordinates
      const validPlaces = placesToDisplayOnMap.filter(place => {
        if (!place.x || !place.y || isNaN(Number(place.x)) || isNaN(Number(place.y))) {
          console.warn(`[MapMarkers] 장소 '${place.name}'의 좌표가 없거나 유효하지 않습니다. 마커를 생성하지 않습니다.`);
          return false;
        }
        return true;
      });

      if (validPlaces.length === 0) {
        console.warn("[MapMarkers] 유효한 좌표를 가진 장소가 없습니다.");
        return;
      }

      console.log(`[MapMarkers] 유효한 좌표를 가진 장소 ${validPlaces.length}개를 표시합니다.`);
      
      // useMapFeatures에서 가져온 addMarkers 사용
      const newMarkers = addMarkersFromFeatures(
        validPlaces,
        {
          highlightPlaceId: selectedPlace?.id || highlightPlaceId, // If selectedPlace is for infoWindow, use highlightPlaceId for general highlight
          isItinerary: isDisplayingItineraryDayMode,
          itineraryOrder: isDisplayingItineraryDayMode, // Show numbers only in itinerary mode
          useColorByCategory: true, // Example: always use category colors
          onMarkerClick: (place, index) => {
            if (onPlaceClick) {
              console.log(`[MapMarkers] 마커 클릭 전달: ${place.name} (${index})`);
              onPlaceClick(place, index);
            } else {
              console.log(`[MapMarkers] 마커 클릭 (onPlaceClick 없음): ${place.name}`);
            }
          }
        }
      );
      markersRef.current = newMarkers;


      // 지도 범위 조정 (selectedPlace가 없거나, 특정 장소 하이라이트가 아닐 때)
      // selectedPlace는 정보창 대상, highlightPlaceId는 일반 하이라이트.
      // 일정 모드일 때는 항상 fitBounds. 그 외에는 placesToDisplayOnMap이 있고, 특정 장소 확대가 아닐 때.
      if (isDisplayingItineraryDayMode && validPlaces.length > 0) {
        console.log("[MapMarkers] 일정 모드: 마커에 맞게 지도 범위 조정");
        fitBoundsToPlaces(map, validPlaces);
      } else if (validPlaces.length > 0 && !highlightPlaceId && !selectedPlace) {
         console.log("[MapMarkers] 일반 모드: 마커에 맞게 지도 범위 조정 (하이라이트 없음)");
         fitBoundsToPlaces(map, validPlaces);
      }

    } else {
      console.log("[MapMarkers] 표시할 장소가 없습니다.");
    }
    
    // 특정 장소(selectedPlace for InfoWindow, or highlightPlaceId for general highlight)로 이동 및 줌
    const placeToFocus = selectedPlace || (highlightPlaceId ? placesToDisplayOnMap.find(p => p.id === highlightPlaceId) : null);

    if (placeToFocus) {
      if (placeToFocus.y && placeToFocus.x && !isNaN(Number(placeToFocus.x)) && !isNaN(Number(placeToFocus.y))) {
        console.log(`[MapMarkers] 특정 장소로 이동: ${placeToFocus.name}`);
        if (map.getZoom() < 15) map.setZoom(15); 
        panToPosition(map, placeToFocus.y, placeToFocus.x);
      } else {
        console.warn(`[MapMarkers] 포커스할 장소 '${placeToFocus.name}'의 좌표가 유효하지 않습니다.`);
      }
    }
    
    // 기존 컴포넌트 언마운트 시 클린업 로직은 markersRef.current를 직접 관리하므로 유지
    return () => {
      // clearDrawnMarkers(markersRef.current); // This might clear too eagerly if map persists
      // markersRef.current = [];
    };
  }, [
    map, 
    isMapInitialized, 
    isNaverLoaded, 
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, // globally selected
    onPlaceClick,
    addMarkersFromFeatures, // from hook
    highlightPlaceId // prop for highlighting
  ]);

  return null;
};

export default MapMarkers;
