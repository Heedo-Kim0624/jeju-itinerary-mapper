
import React, { useEffect, useState, useCallback } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { getCategoryColor } from '@/utils/categoryColors';
import { toast } from 'sonner';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place, index: number) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
  onPlaceClick
}) => {
  const { 
    isMapInitialized, 
    addMarkers, 
    clearMarkersAndUiElements,
    panTo,
    renderItineraryRoute,
    highlightSegment
  } = useMapContext();
  
  const [infoWindows, setInfoWindows] = useState<any[]>([]);
  const [markerRefs, setMarkerRefs] = useState<any[]>([]);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((place: Place, index: number) => {
    console.log(`마커 클릭: ${place.name} (${index + 1}번)`);
    
    // 현재 일정과 선택된 일자가 있는 경우, 해당 장소에서 다음 장소로의 경로를 하이라이트
    if (itinerary && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        // 다음 장소 인덱스 계산 (마지막 장소면 첫번째 장소로)
        const nextIndex = (index + 1) % currentDayItinerary.places.length;
        
        // 경로 하이라이트 호출
        if (typeof highlightSegment === 'function') {
          highlightSegment(index, nextIndex);
        }
      }
    }
    
    // 외부에서 전달받은 클릭 핸들러가 있으면 호출
    if (onPlaceClick) {
      onPlaceClick(place, index);
    }
  }, [itinerary, selectedDay, highlightSegment, onPlaceClick]);

  // 종속성 배열에 모든 관련 props 추가하여 변경 시 재렌더링
  useEffect(() => {
    if (!isMapInitialized) {
      return;
    }

    console.log("MapMarkers: 데이터 변경 감지", {
      placesCount: places.length,
      selectedPlaceExists: !!selectedPlace,
      itineraryDays: itinerary?.length || 0,
      selectedDay,
      selectedPlacesCount: selectedPlaces.length,
      isMapReady: isMapInitialized
    });

    renderData();
  }, [
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    isMapInitialized
  ]);

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다.");
      return;
    }

    console.log("MapMarkers: 데이터 렌더링 시작");
    clearMarkersAndUiElements();

    if (selectedPlace) {
      // 장소가 선택되었을 때, 해당 장소를 지도에 하이라이트
      console.log("선택된 장소 표시:", selectedPlace.name);
      const markers = addMarkers([selectedPlace], { highlight: true });
      setMarkerRefs(markers);
      
      // 선택된 장소로 지도 이동
      if (selectedPlace.x && selectedPlace.y) {
        panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
      }
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      // 일정이 선택된 경우 해당 일자의 장소와 경로를 표시
      const selectedItinerary = itinerary.find(day => day.day === selectedDay);
      if (selectedItinerary) {
        console.log(`[MapMarkers] 일정 ${selectedDay}일차 표시, 장소 ${selectedItinerary.places.length}개`);
        
        // 카테고리별로 색상을 다르게 표시
        const markers = addMarkers(selectedItinerary.places, { 
          isItinerary: true,
          useColorByCategory: true,
          onClick: handleMarkerClick // 마커 클릭 핸들러 추가
        });
        
        setMarkerRefs(markers);
        
        // 해당 일자의 경로 시각화 - 중요!
        console.log(`[MapMarkers] ${selectedDay}일차 경로 렌더링 시작`);
        renderItineraryRoute(selectedItinerary);
        
        // 첫 번째 장소로 지도 중심 이동
        if (selectedItinerary.places.length > 0 && 
            selectedItinerary.places[0].x && 
            selectedItinerary.places[0].y) {
          panTo({
            lat: selectedItinerary.places[0].y,
            lng: selectedItinerary.places[0].x
          });
        }
      } else {
        console.warn(`${selectedDay}일차 일정을 찾을 수 없습니다`);
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      // 명시적으로 선택된 장소들을 표시 (카테고리별 색상)
      console.log("선택된 장소 목록 표시", selectedPlaces.length);
      const markers = addMarkers(selectedPlaces, { highlight: true, useColorByCategory: true });
      setMarkerRefs(markers);
    } else if (places && places.length > 0) {
      // 일반 장소 리스트 표시
      console.log("일반 장소 목록 표시", places.length);
      const markers = addMarkers(places, { useColorByCategory: true });
      setMarkerRefs(markers);
    }
  };

  // 특정 장소 간 경로 하이라이트 함수
  const highlightRoute = (fromIndex: number, toIndex: number) => {
    if (!itinerary || selectedDay === null) {
      toast.error("일정이 선택되지 않았습니다.");
      return;
    }

    const dayItinerary = itinerary.find(day => day.day === selectedDay);
    if (!dayItinerary) {
      toast.error("해당 일자의 일정을 찾을 수 없습니다.");
      return;
    }

    // 맵 컨텍스트의 highlightSegment 함수 호출
    if (typeof highlightSegment === 'function') {
      highlightSegment(fromIndex, toIndex, dayItinerary);
      console.log(`${fromIndex + 1}번 장소에서 ${toIndex + 1}번 장소까지 경로 하이라이트`);
    } else {
      console.error("highlightSegment 함수가 정의되지 않았습니다.");
    }
  };

  return null; // 이 컴포넌트는 아무것도 렌더링하지 않고, 지도에 마커만 추가함
};

export default MapMarkers;
