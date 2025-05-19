
import { useEffect, useState, useCallback } from 'react';
import { useMapContext } from './MapContext';
// Place, ItineraryDay, ItineraryPlaceWithTime 타입을 @/types/index.ts 에서 가져오도록 수정
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types';
import { extractAllNodesFromRoute } from '@/utils/routeParser';

interface MapMarkersProps {
  places: Place[]; // Place[] 타입 사용
  selectedPlace: Place | null; // Place | null 타입 사용
  itinerary: ItineraryDay[] | null; // ItineraryDay[] 타입 사용
  selectedDay: number | null;
  selectedPlaces?: Place[]; // Place[] 타입 사용
  onPlaceClick?: (place: Place, index: number) => void; // Place 타입 콜백
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
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes, // 반환 타입이 Place[] 여야 함
    showRouteForPlaceIndex
  } = useMapContext();
  
  const [markerRefs, setMarkerRefs] = useState<any[]>([]); // 마커 참조는 naver.maps.Marker[] 일 수 있음

  const handleMarkerClick = useCallback((place: Place, index: number) => { // place는 Place 타입
    console.log(`마커 클릭: ${place.name} (${index + 1}번)`);
    
    if (isGeoJsonLoaded && place.geoNodeId) {
      console.log(`장소 "${place.name}"의 GeoJSON 노드 ID: ${place.geoNodeId}, 거리: ${place.geoNodeDistance?.toFixed(2)}m`);
    }
    
    if (itinerary && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        const placeItineraryIndex = currentDayItinerary.places.findIndex(p => p.id === place.id); // p.id와 place.id는 string
        if (placeItineraryIndex !== -1) {
          showRouteForPlaceIndex(placeItineraryIndex, currentDayItinerary);
        } else {
          console.warn(`클릭된 장소 ${place.name}를 현재 일정에서 찾을 수 없습니다.`);
        }
      }
    }
    
    if (onPlaceClick) {
      onPlaceClick(place, index);
    }
  }, [itinerary, selectedDay, onPlaceClick, isGeoJsonLoaded, showRouteForPlaceIndex, places]); // places 추가

  const renderMapData = useCallback(() => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다. (MapMarkers)");
      return;
    }

    console.log("MapMarkers: 데이터 렌더링 시작");
    clearMarkersAndUiElements();

    // mapPlacesWithGeoNodes가 Place[]를 반환하도록 수정됨
    const mappedPlaces = (inputPlaces: Place[]): Place[] => 
      isGeoJsonLoaded ? mapPlacesWithGeoNodes(inputPlaces) : inputPlaces;

    if (selectedPlace) {
      const placeToDisplay = mappedPlaces([selectedPlace])[0];
      const markers = addMarkers([placeToDisplay], { highlight: true, onClick: handleMarkerClick }); // addMarkers는 Place[]를 받음
      setMarkerRefs(markers);
      if (placeToDisplay.x && placeToDisplay.y) {
        panTo({ lat: placeToDisplay.y, lng: placeToDisplay.x });
      }
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        console.log(`[MapMarkers] 일정 ${selectedDay}일차 표시, 장소 ${currentDayItinerary.places.length}개`);
        
        // currentDayItinerary.places는 ItineraryPlaceWithTime[]이고, 이는 Place를 확장하므로 호환됨
        const placesForMarkers: Place[] = mappedPlaces(currentDayItinerary.places as Place[]); 
        
        const markers = addMarkers(placesForMarkers, { 
          isItinerary: true,
          useColorByCategory: true,
          onClick: handleMarkerClick
        });
        setMarkerRefs(markers);
        
        console.log(`[MapMarkers] ${selectedDay}일차 경로 렌더링 시작`);
        renderItineraryRoute(currentDayItinerary);
        
        if (placesForMarkers.length > 0 && placesForMarkers[0].x && placesForMarkers[0].y) {
          panTo({ lat: placesForMarkers[0].y, lng: placesForMarkers[0].x });
        }
      } else {
        console.warn(`${selectedDay}일차 일정을 찾을 수 없습니다 (MapMarkers)`);
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      const placesToDisplay = mappedPlaces(selectedPlaces);
      const markers = addMarkers(placesToDisplay, { highlight: true, useColorByCategory: true, onClick: handleMarkerClick });
      setMarkerRefs(markers);
    } else if (places && places.length > 0) {
      const placesToDisplay = mappedPlaces(places);
      const markers = addMarkers(placesToDisplay, { useColorByCategory: true, onClick: handleMarkerClick });
      setMarkerRefs(markers);
    }
  }, [
    isMapInitialized, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    places, 
    isGeoJsonLoaded, 
    clearMarkersAndUiElements, 
    mapPlacesWithGeoNodes, 
    addMarkers, 
    panTo, 
    renderItineraryRoute,
    handleMarkerClick
  ]);

  useEffect(() => {
    if (!isMapInitialized) return;

    console.log("MapMarkers: 데이터 변경 감지", {
      placesCount: places?.length || 0,
      selectedPlaceExists: !!selectedPlace,
      itineraryDays: itinerary?.length || 0,
      selectedDay,
      selectedPlacesCount: selectedPlaces?.length || 0
    });

    renderMapData();
    
  }, [
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    isMapInitialized,
    isGeoJsonLoaded, // isGeoJsonLoaded 변경 시에도 재렌더링
    renderMapData
  ]);

  return null; 
};

export default MapMarkers;
