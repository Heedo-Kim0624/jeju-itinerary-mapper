
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { getCategoryColor } from '@/utils/categoryColors';

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [],
}) => {
  const { 
    isMapInitialized, 
    addMarkers, 
    clearMarkersAndUiElements,
    panTo,
    renderItineraryRoute
  } = useMapContext();

  useEffect(() => {
    if (!isMapInitialized) {
      return;
    }

    renderData();
  }, [places, selectedPlace, itinerary, selectedDay, selectedPlaces, isMapInitialized]);

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다.");
      return;
    }

    clearMarkersAndUiElements();

    if (selectedPlace) {
      // 장소가 선택되었을 때, 해당 장소를 지도에 하이라이트
      console.log("선택된 장소 표시:", selectedPlace.name);
      addMarkers([selectedPlace], { highlight: true });
      
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
        addMarkers(selectedItinerary.places, { 
          isItinerary: true,
          useColorByCategory: true 
        });
        
        // 해당 일자의 경로 시각화
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
      addMarkers(selectedPlaces, { highlight: true, useColorByCategory: true });
    } else if (places && places.length > 0) {
      // 일반 장소 리스트 표시
      addMarkers(places, { useColorByCategory: true });
    }
  };

  return null; // 이 컴포넌트는 아무것도 렌더링하지 않고, 지도에 마커만 추가함
};

export default MapMarkers;
