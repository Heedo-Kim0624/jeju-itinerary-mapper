
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay } from '@/types/supabase';

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
  const { isMapInitialized, calculateRoutes, addMarkers, clearMarkersAndUiElements, panTo } = useMapContext();

  useEffect(() => {
    if (!isMapInitialized) {
      return;
    }

    renderData();
  }, [places, selectedPlace, itinerary, selectedDay, selectedPlaces, isMapInitialized]);

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("Map is not yet initialized.");
      return;
    }

    clearMarkersAndUiElements();

    if (selectedPlace) {
      // 장소가 선택되었을 때, 해당 장소를 지도에 하이라이트
      console.log("Rendering selected place:", selectedPlace);
      addMarkers([selectedPlace], { highlight: true });
      
      // 선택된 장소로 지도 이동
      if (selectedPlace.x && selectedPlace.y) {
        panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
      }
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const selectedItinerary = itinerary.find(day => day.day === selectedDay);
      if (selectedItinerary) {
        addMarkers(selectedItinerary.places, { isItinerary: true });
        calculateRoutes(selectedItinerary.places);
      } else {
        console.warn(`No itinerary found for day ${selectedDay}`);
        addMarkers(places, { highlight: false });
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      // 명시적으로 선택된 장소들을 표시
      addMarkers(selectedPlaces, { highlight: true });
    } else {
      // 기본 상태: 모든 장소 표시
      addMarkers(places, { highlight: false });
    }
  };

  return null; // 이 컴포넌트는 아무것도 렌더링하지 않고, 지도에 마커만 추가함
};

export default MapMarkers;
