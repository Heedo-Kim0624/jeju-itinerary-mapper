
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
    highlightSegment,
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes
  } = useMapContext();
  
  const [infoWindows, setInfoWindows] = useState<any[]>([]);
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
        // 다음 장소 인덱스 계산 (마지막 장소면 첫번째 장소로)
        const nextIndex = (index + 1) % currentDayItinerary.places.length;
        
        // 경로 하이라이트 호출
        highlightSegment(index, nextIndex, currentDayItinerary);
      }
    }
    
    // 외부에서 전달받은 클릭 핸들러가 있으면 호출
    if (onPlaceClick) {
      onPlaceClick(place, index);
    }
  }, [itinerary, selectedDay, highlightSegment, onPlaceClick, isGeoJsonLoaded]);

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
      isMapReady: isMapInitialized,
      isGeoJsonLoaded
    });

    renderData();
  }, [
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    isMapInitialized,
    isGeoJsonLoaded // GeoJSON 로드 상태가 변경되면 다시 렌더링
  ]);

  const renderData = () => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다.");
      return;
    }

    console.log("MapMarkers: 데이터 렌더링 시작");
    clearMarkersAndUiElements();

    // GeoJSON 매핑 확인
    const useMappedPlaces = isGeoJsonLoaded;
    
    if (selectedPlace) {
      // 장소가 선택되었을 때, 해당 장소를 지도에 하이라이트
      console.log("선택된 장소 표시:", selectedPlace.name);
      const placeToDisplay = useMappedPlaces ? 
        mapPlacesWithGeoNodes([selectedPlace])[0] : selectedPlace;
      
      const markers = addMarkers([placeToDisplay], { highlight: true });
      setMarkerRefs(markers);
      
      // 선택된 장소로 지도 이동
      if (placeToDisplay.x && placeToDisplay.y) {
        panTo({ lat: placeToDisplay.y, lng: placeToDisplay.x });
      }
      return;
    }

    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      // 일정이 선택된 경우 해당 일자의 장소와 경로를 표시
      const selectedItinerary = itinerary.find(day => day.day === selectedDay);
      if (selectedItinerary) {
        console.log(`[MapMarkers] 일정 ${selectedDay}일차 표시, 장소 ${selectedItinerary.places.length}개`);
        
        // GeoJSON 매핑된 장소 사용
        const placesToDisplay = useMappedPlaces ? 
          mapPlacesWithGeoNodes(selectedItinerary.places) : 
          selectedItinerary.places;
          
        // 카테고리별로 색상을 다르게 표시
        const markers = addMarkers(placesToDisplay, { 
          isItinerary: true,
          useColorByCategory: true
        });
        
        setMarkerRefs(markers);
        
        // 해당 일자의 경로 시각화 - 중요!
        console.log(`[MapMarkers] ${selectedDay}일차 경로 렌더링 시작`);
        
        // GeoJSON 매핑을 활용하여 경로 렌더링
        if (useMappedPlaces) {
          console.log('GeoJSON 매핑된 장소로 경로 렌더링');
          
          // 매핑 결과 확인
          if (!geoJsonMappingChecked) {
            const mappedCount = placesToDisplay.filter(p => p.geoNodeId).length;
            const mappingRate = (mappedCount / placesToDisplay.length) * 100;
            
            console.log(`장소-노드 매핑율: ${mappingRate.toFixed(1)}% (${mappedCount}/${placesToDisplay.length})`);
            setGeoJsonMappingChecked(true);
            
            // 매핑율이 낮으면 경고
            if (mappingRate < 50) {
              console.warn('GeoJSON 노드 매핑율이 낮아 경로가 정확하지 않을 수 있습니다.');
            }
          }
        }
        
        renderItineraryRoute(selectedItinerary);
        
        // 첫 번째 장소로 지도 중심 이동
        if (placesToDisplay.length > 0 && 
            placesToDisplay[0].x && 
            placesToDisplay[0].y) {
          panTo({
            lat: placesToDisplay[0].y,
            lng: placesToDisplay[0].x
          });
        }
      } else {
        console.warn(`${selectedDay}일차 일정을 찾을 수 없습니다`);
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      // 명시적으로 선택된 장소들을 표시 (카테고리별 색상)
      console.log("선택된 장소 목록 표시", selectedPlaces.length);
      
      // GeoJSON 매핑된 장소 사용
      const placesToDisplay = useMappedPlaces ? 
        mapPlacesWithGeoNodes(selectedPlaces) : 
        selectedPlaces;
        
      const markers = addMarkers(placesToDisplay, { highlight: true, useColorByCategory: true });
      setMarkerRefs(markers);
    } else if (places && places.length > 0) {
      // 일반 장소 리스트 표시
      console.log("일반 장소 목록 표시", places.length);
      
      // GeoJSON 매핑된 장소 사용
      const placesToDisplay = useMappedPlaces ? 
        mapPlacesWithGeoNodes(places) : 
        places;
        
      const markers = addMarkers(placesToDisplay, { useColorByCategory: true });
      setMarkerRefs(markers);
    }
  };

  return null; // 이 컴포넌트는 아무것도 렌더링하지 않고, 지도에 마커만 추가함
};

export default MapMarkers;
