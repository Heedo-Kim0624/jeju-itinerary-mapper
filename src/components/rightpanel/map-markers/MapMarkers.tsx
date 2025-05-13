
import { useEffect, useState, useCallback } from 'react';
import { useMapContext } from '../MapContext';
import { Place, ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { useMarkerEffects } from './useMarkerEffects';
import { useRouteRendering } from './useRouteRendering';

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
    showRouteForPlaceIndex,
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes
  } = useMapContext();
  
  const [markerRefs, setMarkerRefs] = useState<any[]>([]);
  const [geoJsonMappingChecked, setGeoJsonMappingChecked] = useState<boolean>(false);

  // 마커 클릭 핸들러
  const handleMarkerClick = useCallback((place: Place, index: number) => {
    console.log(`마커 클릭: ${place.name} (${index + 1}번)`);
    
    // GeoJSON 노드 매핑 디버깅 정보
    if (isGeoJsonLoaded && place.geoNodeId) {
      console.log(`장소 "${place.name}"의 GeoJSON 노드 ID: ${place.geoNodeId}, 거리: ${place.geoNodeDistance?.toFixed(2)}m`);
    }
    
    // 현재 일정과 선택된 일자가 있는 경우, 해당 장소에서 다음 장소로의 경로를 하이라이트
    if (itinerary && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        // 선택된 장소에 대한 경로 표시
        showRouteForPlaceIndex(index, currentDayItinerary);
      }
    }
    
    // 외부에서 전달받은 클릭 핸들러가 있으면 호출
    if (onPlaceClick) {
      onPlaceClick(place, index);
    }
  }, [itinerary, selectedDay, onPlaceClick, isGeoJsonLoaded, showRouteForPlaceIndex]);

  // 데이터 변경 시 지도 업데이트
  useEffect(() => {
    if (!isMapInitialized) return;

    console.log("MapMarkers: 데이터 변경 감지", {
      placesCount: places.length,
      selectedPlaceExists: !!selectedPlace,
      itineraryDays: itinerary?.length || 0,
      selectedDay,
      selectedPlacesCount: selectedPlaces.length
    });

    // 데이터 렌더링 함수 호출
    renderMapData();
    
  }, [
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    isMapInitialized,
    isGeoJsonLoaded // GeoJSON 로드 상태가 변경되면 다시 렌더링
  ]);

  // 지도에 데이터 렌더링
  const renderMapData = () => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다.");
      return;
    }

    console.log("MapMarkers: 데이터 렌더링 시작");
    clearMarkersAndUiElements();

    // GeoJSON 매핑 확인
    const useMappedPlaces = isGeoJsonLoaded;
    
    if (selectedPlace) {
      renderSelectedPlace(selectedPlace, useMappedPlaces);
      return;
    }

    // 일정이 선택된 경우
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      renderItineraryForDay(itinerary, selectedDay, useMappedPlaces);
      return;
    }
    
    // 선택된 장소들이 있는 경우
    if (selectedPlaces && selectedPlaces.length > 0) {
      renderSelectedPlaces(selectedPlaces, useMappedPlaces);
      return;
    }
    
    // 일반 장소 목록 표시
    if (places && places.length > 0) {
      renderGeneralPlaces(places, useMappedPlaces);
    }
  };

  // 선택된 단일 장소 렌더링
  const renderSelectedPlace = (place: Place, useMappedPlaces: boolean) => {
    console.log("선택된 장소 표시:", place.name);
    const placeToDisplay = useMappedPlaces ? 
      mapPlacesWithGeoNodes([place])[0] : place;
    
    const markers = addMarkers([placeToDisplay], { highlight: true });
    setMarkerRefs(markers);
    
    // 선택된 장소로 지도 이동
    if (placeToDisplay.x && placeToDisplay.y) {
      panTo({ lat: placeToDisplay.y, lng: placeToDisplay.x });
    }
  };

  // 특정 일자의 일정 렌더링
  const renderItineraryForDay = (itinerary: ItineraryDay[], selectedDay: number, useMappedPlaces: boolean) => {
    const selectedItinerary = itinerary.find(day => day.day === selectedDay);
    if (selectedItinerary) {
      console.log(`[MapMarkers] 일정 ${selectedDay}일차 표시, 장소 ${selectedItinerary.places.length}개`);
      
      // GeoJSON 매핑된 장소 사용
      const placesToDisplay = useMappedPlaces ? 
        mapPlacesWithGeoNodes(selectedItinerary.places) : 
        selectedItinerary.places;
        
      // 카테고리별로 색상을 다르게 표시하는 마커 추가
      const markers = addMarkers(placesToDisplay, { 
        isItinerary: true,
        useColorByCategory: true,
        onClick: handleMarkerClick
      });
      
      setMarkerRefs(markers);
      
      // 일정 경로 렌더링
      console.log(`[MapMarkers] ${selectedDay}일차 경로 렌더링 시작`);
      
      // GeoJSON 매핑이 완료된 경우만 경로 렌더링
      if (useMappedPlaces) {
        console.log('GeoJSON 매핑된 장소로 경로 렌더링');
        
        // 매핑 결과 확인
        if (!geoJsonMappingChecked) {
          checkGeoJsonMappingRate(placesToDisplay);
        }
      }
      
      // 일정 경로 렌더링 (맵 컨텍스트 함수 사용)
      renderItineraryRoute(selectedItinerary);
      
      // 첫 번째 장소로 지도 중심 이동
      moveMapToFirstPlace(placesToDisplay);
    } else {
      console.warn(`${selectedDay}일차 일정을 찾을 수 없습니다`);
    }
  };

  // 선택된 장소들 렌더링
  const renderSelectedPlaces = (places: Place[], useMappedPlaces: boolean) => {
    console.log("선택된 장소 목록 표시", places.length);
    
    // GeoJSON 매핑된 장소 사용
    const placesToDisplay = useMappedPlaces ? 
      mapPlacesWithGeoNodes(places) : places;
      
    const markers = addMarkers(placesToDisplay, {
      highlight: true,
      useColorByCategory: true,
      onClick: handleMarkerClick
    });
    setMarkerRefs(markers);
  };

  // 일반 장소 목록 렌더링
  const renderGeneralPlaces = (places: Place[], useMappedPlaces: boolean) => {
    console.log("일반 장소 목록 표시", places.length);
    
    // GeoJSON 매핑된 장소 사용
    const placesToDisplay = useMappedPlaces ? 
      mapPlacesWithGeoNodes(places) : places;
      
    const markers = addMarkers(placesToDisplay, { 
      useColorByCategory: true,
      onClick: handleMarkerClick
    });
    setMarkerRefs(markers);
  };

  // GeoJSON 매핑률 확인 및 경고
  const checkGeoJsonMappingRate = (places: Place[]) => {
    const mappedCount = places.filter(p => p.geoNodeId).length;
    const mappingRate = places.length > 0 ? (mappedCount / places.length) * 100 : 0;
    
    console.log(`장소-노드 매핑율: ${mappingRate.toFixed(1)}% (${mappedCount}/${places.length})`);
    setGeoJsonMappingChecked(true);
    
    // 매핑율이 낮으면 경고
    if (mappingRate < 50) {
      console.warn('GeoJSON 노드 매핑율이 낮아 경로가 정확하지 않을 수 있습니다.');
      toast.warning('일부 장소의 경로 정보가 부정확할 수 있습니다.');
    }
  };

  // 첫 번째 장소로 지도 이동
  const moveMapToFirstPlace = (places: Place[]) => {
    if (places.length > 0 && places[0].x && places[0].y) {
      panTo({
        lat: places[0].y,
        lng: places[0].x
      });
    }
  };

  return null; // 시각적 요소는 렌더링하지 않음
};

export default MapMarkers;
