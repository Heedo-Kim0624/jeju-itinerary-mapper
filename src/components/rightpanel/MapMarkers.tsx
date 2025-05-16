import { useEffect, useState, useCallback } from 'react';
import { useMapContext } from './MapContext';
import { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/supabase';
import { toast } from 'sonner';
import { extractAllNodesFromRoute } from '@/utils/routeParser';

interface MapMarkersProps {
  places: Place[]; // 일반 장소 목록 (선택 전)
  selectedPlace: Place | null; // 단일 선택된 장소
  itinerary: ItineraryDay[] | null; // 생성된 전체 일정
  selectedDay: number | null; // 현재 선택된 일정 일자
  selectedPlaces?: Place[]; // 왼쪽 패널에서 사용자가 선택한 장소들 (일정 생성 전)
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
    isGeoJsonLoaded,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex
  } = useMapContext();
  
  const [markerRefs, setMarkerRefs] = useState<any[]>([]);
  const [geoJsonMappingChecked, setGeoJsonMappingChecked] = useState<boolean>(false);

  const handleMarkerClick = useCallback((place: Place, index: number) => {
    console.log(`마커 클릭: ${place.name} (${index + 1}번)`);
    
    if (isGeoJsonLoaded && place.geoNodeId) {
      console.log(`장소 "${place.name}"의 GeoJSON 노드 ID: ${place.geoNodeId}, 거리: ${place.geoNodeDistance?.toFixed(2)}m`);
    }
    
    if (itinerary && selectedDay !== null) {
      const currentDayItinerary = itinerary.find(day => day.day === selectedDay);
      if (currentDayItinerary) {
        // ItineraryDay의 places 배열에서 실제 index를 찾아야 함.
        // 현재 place 객체가 currentDayItinerary.places 중 몇 번째인지 확인
        const placeItineraryIndex = currentDayItinerary.places.findIndex(p => p.id === place.id);
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
  }, [itinerary, selectedDay, onPlaceClick, isGeoJsonLoaded, showRouteForPlaceIndex]);

  useEffect(() => {
    if (!isMapInitialized) return;

    console.log("MapMarkers: 데이터 변경 감지", {
      placesCount: places.length,
      selectedPlaceExists: !!selectedPlace,
      itineraryDays: itinerary?.length || 0,
      selectedDay,
      selectedPlacesCount: selectedPlaces.length
    });

    renderMapData();
    
  }, [
    places, 
    selectedPlace, 
    itinerary, 
    selectedDay, 
    selectedPlaces, 
    isMapInitialized,
    isGeoJsonLoaded 
  ]);

  const renderMapData = () => {
    if (!isMapInitialized) {
      console.warn("지도가 초기화되지 않았습니다. (MapMarkers)");
      return;
    }

    console.log("MapMarkers: 데이터 렌더링 시작");
    clearMarkersAndUiElements();

    const useMappedPlaces = isGeoJsonLoaded;

    if (selectedPlace) {
      const placeToDisplay = useMappedPlaces ? 
        mapPlacesWithGeoNodes([selectedPlace])[0] : selectedPlace;
      const markers = addMarkers([placeToDisplay], { highlight: true, onClick: handleMarkerClick });
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
        
        let placesForMarkers: ItineraryPlaceWithTime[] = currentDayItinerary.places;
        
        if (currentDayItinerary.interleaved_route) {
            const placeNodeIdsFromRoute = extractAllNodesFromRoute(currentDayItinerary.interleaved_route)
                .filter((_, index) => index % 2 === 0) // 장소 노드만 (노드-링크-노드 구조에서 짝수 인덱스)
                .map(String); 
            
            console.log(`[MapMarkers] ${selectedDay}일차 interleaved_route 기반 마커 표시 준비`);
        }
        
        const markers = addMarkers(placesForMarkers, { 
          isItinerary: true,
          useColorByCategory: true,
          onClick: handleMarkerClick
        });
        setMarkerRefs(markers);
        
        renderItineraryRoute(currentDayItinerary);
        
        if (placesForMarkers.length > 0 && placesForMarkers[0].x && placesForMarkers[0].y) {
          panTo({ lat: placesForMarkers[0].y, lng: placesForMarkers[0].x });
        }
      } else {
        console.warn(`${selectedDay}일차 일정을 찾을 수 없습니다 (MapMarkers)`);
      }
    } else if (selectedPlaces && selectedPlaces.length > 0) {
      const placesToDisplay = useMappedPlaces ? mapPlacesWithGeoNodes(selectedPlaces) : selectedPlaces;
      const markers = addMarkers(placesToDisplay, { highlight: true, useColorByCategory: true, onClick: handleMarkerClick });
      setMarkerRefs(markers);
    } else if (places && places.length > 0) {
      const placesToDisplay = useMappedPlaces ? mapPlacesWithGeoNodes(places) : places;
      const markers = addMarkers(placesToDisplay, { useColorByCategory: true, onClick: handleMarkerClick });
      setMarkerRefs(markers);
    }
  };

  return null; 
};

export default MapMarkers;
