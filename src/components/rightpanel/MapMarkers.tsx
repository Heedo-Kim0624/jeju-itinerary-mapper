
import React, { useState, useEffect } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place, index: number) => void;
}

/**
 * 지도에 장소 마커를 표시하는 컴포넌트
 */
const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick
}) => {
  // 지도 컨텍스트에서 필요한 기능들 가져오기
  const {
    map,
    addMarkers,
    clearMarkersAndUiElements,
    renderItineraryRoute,
    isMapInitialized
  } = useMapContext();

  // 이전에 클릭한 장소 상태 추적
  const [lastClickedPlaceId, setLastClickedPlaceId] = useState<string | number | null>(null);

  /**
   * 선택된 장소 하이라이트
   */
  useEffect(() => {
    if (!isMapInitialized || !selectedPlace) return;

    // 마지막 클릭 장소와 선택 장소가 같으면 중복 작업 방지
    if (lastClickedPlaceId === selectedPlace.id) return;
    
    console.log("MapMarkers: 선택 장소 하이라이트", selectedPlace.name);
    setLastClickedPlaceId(selectedPlace.id);
    
    clearMarkersAndUiElements();
    addMarkers([selectedPlace], { highlight: true });
    
  }, [selectedPlace, isMapInitialized, addMarkers, clearMarkersAndUiElements, lastClickedPlaceId]);

  /**
   * 이용 가능한 모든 장소 표시
   */
  useEffect(() => {
    if (!isMapInitialized || places.length === 0) return;

    // 선택된 장소가 있으면 다른 장소를 표시하지 않음
    if (selectedPlace) return;
    
    // 일정 뷰가 활성화되어 있으면 모든 장소를 표시하지 않음
    if (itinerary && selectedDay !== null) return;

    console.log(`MapMarkers: ${places.length}개 장소 마커 표시`);
    clearMarkersAndUiElements();
    
    // 선택된 장소들과 일반 장소를 구분하여 스타일 적용
    const selectedIds = new Set(selectedPlaces.map(p => p.id));
    const placesToShow = places.map(place => ({
      ...place,
      isSelected: selectedIds.has(place.id)
    }));

    addMarkers(placesToShow, { 
      useColorByCategory: true,
      onClick: (place, index) => {
        if (onPlaceClick) {
          onPlaceClick(place, index);
          setLastClickedPlaceId(place.id);
        }
      }
    });
    
  }, [
    places, 
    isMapInitialized, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    addMarkers, 
    clearMarkersAndUiElements, 
    selectedPlaces,
    onPlaceClick
  ]);

  /**
   * 선택된 일정 일자의 경로 표시
   */
  useEffect(() => {
    if (!isMapInitialized || !itinerary || selectedDay === null) return;

    // 선택한 일자 찾기
    const dayIndex = selectedDay - 1;
    if (dayIndex < 0 || dayIndex >= itinerary.length) {
      console.warn(`MapMarkers: 유효하지 않은 일정 일자 - ${selectedDay}일차`);
      return;
    }

    const selectedItineraryDay = itinerary[dayIndex];
    console.log(`MapMarkers: ${selectedDay}일차 일정 경로 표시 (${selectedItineraryDay.places.length}개 장소)`);
    
    // 일정 경로 표시
    clearMarkersAndUiElements();
    renderItineraryRoute(selectedItineraryDay);
    
    // 일정 장소 마커 표시 (경로와 함께)
    addMarkers(selectedItineraryDay.places, { 
      isItinerary: true,
      onClick: (place, index) => {
        console.log(`일정의 ${index + 1}번 장소 클릭됨: ${place.name}`);
        // 추가 기능 구현 가능
      }
    });

  }, [
    itinerary, 
    selectedDay, 
    isMapInitialized, 
    addMarkers, 
    clearMarkersAndUiElements, 
    renderItineraryRoute
  ]);

  return null;
};

export default MapMarkers;
