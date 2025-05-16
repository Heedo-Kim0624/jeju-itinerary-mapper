
import { useEffect, useState, useCallback } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
// import { toast } from 'sonner'; // toast는 여기서 직접 사용하지 않음
// import { extractAllNodesFromRoute } from '@/utils/routeParser'; // 직접 사용하지 않음

interface MapMarkersProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null; // 이 prop은 이제 useScheduleManagement에서 주로 관리
  selectedDay: number | null;    // 이 prop도 useScheduleManagement에서 주로 관리
  selectedPlaces?: Place[];
  onPlaceClick?: (place: Place, index: number) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  places,
  selectedPlace,
  itinerary, // 받기는 하지만, 직접적인 마커/경로 그리기는 useScheduleManagement에서 주도
  selectedDay,
  selectedPlaces = [],
  onPlaceClick
}) => {
  const { 
    isMapInitialized, 
    addMarkers, 
    clearMarkersAndUiElements,
    panTo,
    // renderItineraryRoute, // useScheduleManagement에서 직접 호출하므로 여기서 제거 또는 주석
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes, // 필요시 사용
    showRouteForPlaceIndex
  } = useMapContext();
  
  // markerRefs는 더 이상 이 컴포넌트에서 직접 관리할 필요가 없을 수 있음
  // const [markerRefs, setMarkerRefs] = useState<any[]>([]); // 주석 처리 또는 제거 고려

  const handleMarkerClick = useCallback((place: Place, index: number) => {
    console.log(`[MapMarkers] 마커 클릭: ${place.name} (${index + 1}번)`);
    
    if (isGeoJsonLoaded && place.geoNodeId) {
      console.log(`[MapMarkers] 장소 "${place.name}"의 GeoJSON 노드 ID: ${place.geoNodeId}, 거리: ${place.geoNodeDistance?.toFixed(2)}m`);
    }
    
    // itinerary와 selectedDay를 받지만, 실제 경로 하이라이트는 useMapContext를 통해 호출
    if (itinerary && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        const placeItineraryIndex = currentDayItinerary.places.findIndex(p => p.id === place.id);
        if (placeItineraryIndex !== -1) {
          // showRouteForPlaceIndex는 context에서 가져온 함수 사용
          showRouteForPlaceIndex(placeItineraryIndex, currentDayItinerary);
        } else {
           console.warn(`[MapMarkers] 클릭된 장소 ${place.name}를 현재 일정(${selectedDay}일차)에서 찾을 수 없습니다.`);
        }
      }
    }
    
    if (onPlaceClick) {
      onPlaceClick(place, index);
    }
  }, [itinerary, selectedDay, onPlaceClick, isGeoJsonLoaded, showRouteForPlaceIndex]);

  useEffect(() => {
    if (!isMapInitialized) return;

    // 이 컴포넌트는 이제 주로 '일정 외'의 마커 표시(검색 결과, 단일 선택)를 담당.
    // 일정 관련 마커 및 경로는 useScheduleManagement의 useEffect에서 처리됨.
    // 따라서, itinerary나 selectedDay에 따른 복잡한 조건 분기는 제거하거나 단순화.

    console.log("[MapMarkers] useEffect 실행. isMapInitialized:", isMapInitialized, "selectedPlace:", !!selectedPlace, "selectedPlaces:", selectedPlaces.length, "places:", places.length);
    
    // itinerary가 없고, selectedDay도 없을 때만 이 컴포넌트에서 마커를 그림.
    // 또는 selectedPlace가 있을 때.
    if (!itinerary || itinerary.length === 0) { // 일정이 없을 때의 로직
        clearMarkersAndUiElements(); // 기존 마커/경로 정리

        if (selectedPlace) {
            const placeToDisplay = isGeoJsonLoaded ? mapPlacesWithGeoNodes([selectedPlace])[0] : selectedPlace;
            addMarkers([placeToDisplay], { highlight: true, onClick: handleMarkerClick });
            if (placeToDisplay.y && placeToDisplay.x) {
                panTo({ lat: placeToDisplay.y, lng: placeToDisplay.x });
            }
        } else if (selectedPlaces.length > 0) {
            const placesToDisplay = isGeoJsonLoaded ? mapPlacesWithGeoNodes(selectedPlaces) : selectedPlaces;
            addMarkers(placesToDisplay, { useColorByCategory: true, onClick: handleMarkerClick });
             if (placesToDisplay.length > 0 && placesToDisplay[0].y && placesToDisplay[0].x) {
                panTo({ lat: placesToDisplay[0].y, lng: placesToDisplay[0].x });
            }
        } else if (places.length > 0) {
            const placesToDisplay = isGeoJsonLoaded ? mapPlacesWithGeoNodes(places) : places;
            addMarkers(placesToDisplay, { useColorByCategory: true, onClick: handleMarkerClick });
            if (placesToDisplay.length > 0 && placesToDisplay[0].y && placesToDisplay[0].x) {
                panTo({ lat: placesToDisplay[0].y, lng: placesToDisplay[0].x });
            }
        }
    }
    // 일정 관련 마커 및 경로는 useScheduleManagement의 useEffect에서 관리하므로 여기서 중복 처리하지 않음.
    
  }, [
    isMapInitialized, 
    places, 
    selectedPlace, 
    selectedPlaces,
    itinerary, // 의존성에는 포함하되, 로직에서 명시적으로 회피
    // selectedDay, // 의존성에는 포함하되, 로직에서 명시적으로 회피
    addMarkers, 
    clearMarkersAndUiElements, 
    panTo, 
    handleMarkerClick,
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes
  ]);

  // 이 컴포넌트는 UI를 직접 렌더링하지 않음
  return null; 
};

export default MapMarkers;

