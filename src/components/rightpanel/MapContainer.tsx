
import React, { useEffect, useState, useCallback } from 'react';
import Map from './Map'; // Assuming Map component handles Naver Map instance
import { Place, ItineraryDay, SelectedPlace } from '@/types/supabase';
import { useMapContext } from './MapContext';
import { toast } from 'sonner';

interface MapContainerProps {
  places: Place[]; // 일반 장소 목록 (검색 결과 등)
  selectedPlace: Place | null; // 사용자가 선택한 단일 장소 (리스트에서 클릭 등)
  itinerary: ItineraryDay[] | null; // 전체 일정
  selectedDay: number | null; // 선택된 일정 일차
  selectedPlaces?: SelectedPlace[]; // 왼쪽 패널에서 최종 선택된 장소들 (isCandidate 포함 가능)
}

const MapContainer: React.FC<MapContainerProps> = ({
  places,
  selectedPlace,
  itinerary,
  selectedDay,
  selectedPlaces = [], // 기본값 빈 배열로 설정
}) => {
  const { 
    map, 
    addMarkers, 
    clearMarkersAndUiElements, 
    panTo, 
    renderItineraryRoute, 
    clearAllRoutes,
    serverRoutesData,
    renderGeoJsonRoute,
    isGeoJsonLoaded,
    geoJsonNodes,
    geoJsonLinks,
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex
  } = useMapContext();

  const [currentMarkers, setCurrentMarkers] = useState<any[]>([]);
  const [currentRoutes, setCurrentRoutes] = useState<any[]>([]); // 그려진 경로 객체 저장

  // Helper to clear previous markers
  const clearMapElements = useCallback(() => {
    clearMarkersAndUiElements();
    setCurrentMarkers([]);
    clearAllRoutes(); // 기존 Naver 경로 및 GeoJSON 경로 모두 삭제
    setCurrentRoutes([]);
  }, [clearMarkersAndUiElements, clearAllRoutes]);


  // 1. 일정에 따른 마커 및 경로 렌더링 (selectedDay 또는 itinerary 변경 시)
  useEffect(() => {
    if (!map || !itinerary || selectedDay === null) {
      // 일정이 없거나 선택된 날이 없으면 기존 마커/경로 초기화 (옵션)
      // clearMapElements(); // 상황에 따라 이 부분은 주석 처리 가능
      return;
    }

    clearMapElements();
    
    const daySchedule = itinerary.find(d => d.day === selectedDay);

    if (daySchedule) {
      console.log(`[MapContainer] 일차 ${selectedDay} 스케줄 렌더링 시작`, daySchedule);
      
      const placesForDay = mapPlacesWithGeoNodes(daySchedule.places); // GeoNodeId 매핑된 장소 사용
      
      const dayMarkers = addMarkers(placesForDay, { 
        isItinerary: true, 
        useColorByCategory: true,
        onClick: (place, index) => {
          console.log(`[MapContainer] 일차 ${selectedDay}의 ${index + 1}번째 장소 '${place.name}' 마커 클릭됨`);
          // 필요시 특정 장소로 panTo 또는 정보 표시
          if(place.y && place.x) panTo({ lat: place.y, lng: place.x });
          showRouteForPlaceIndex(index, daySchedule);
        }
      });
      setCurrentMarkers(dayMarkers);

      // 서버에서 받은 경로 데이터 사용 (우선)
      const serverRouteForDay = serverRoutesData[selectedDay];
      if (serverRouteForDay && serverRouteForDay.interleaved_route && isGeoJsonLoaded) {
        console.log(`[MapContainer] 일차 ${selectedDay}: 서버 경로 데이터(GeoJSON) 렌더링`, serverRouteForDay);
        
        const nodeIds = serverRouteForDay.nodeIds?.map(String) || [];
        const linkIds = serverRouteForDay.linkIds?.map(String) || [];

        if (nodeIds.length > 0 || linkIds.length > 0) {
           const geoJsonPaths = renderGeoJsonRoute(nodeIds, linkIds, {
            strokeColor: '#FF0000', // 빨간색 경로
            strokeWeight: 4,
            strokeOpacity: 0.8,
           });
           setCurrentRoutes(prev => [...prev, ...geoJsonPaths]);
        } else {
           console.warn(`[MapContainer] 일차 ${selectedDay}: 서버 경로 데이터에 노드/링크 ID가 부족합니다.`);
        }
      } else if (daySchedule.routeData && (daySchedule.routeData.nodeIds || daySchedule.routeData.linkIds) && isGeoJsonLoaded) {
        // 클라이언트에서 생성된 routeData 사용 (차선책)
        console.log(`[MapContainer] 일차 ${selectedDay}: 클라이언트 routeData(GeoJSON) 렌더링`, daySchedule.routeData);
        const nodeIds = daySchedule.routeData.nodeIds?.map(String) || [];
        const linkIds = daySchedule.routeData.linkIds?.map(String) || [];
        
        if (nodeIds.length > 0 || linkIds.length > 0) {
          const geoJsonPaths = renderGeoJsonRoute(nodeIds, linkIds, {
            strokeColor: '#0000FF', // 파란색 경로
            strokeWeight: 3,
            strokeOpacity: 0.7,
          });
          setCurrentRoutes(prev => [...prev, ...geoJsonPaths]);
        } else {
          console.warn(`[MapContainer] 일차 ${selectedDay}: 클라이언트 routeData에 노드/링크 ID가 부족합니다.`);
        }
      } else if (daySchedule.places.length > 1) {
         // 네이버 지도 API 경로 탐색 (최후의 수단)
         console.log(`[MapContainer] 일차 ${selectedDay}: 네이버 길찾기 API로 경로 렌더링`);
         renderItineraryRoute(daySchedule); // This might draw Naver's default polylines
      } else {
        console.log(`[MapContainer] 일차 ${selectedDay}: 경로를 렌더링할 정보가 부족하거나 장소가 1개 이하입니다.`);
      }
      
      // 첫 번째 장소로 지도 이동
      if (placesForDay.length > 0 && placesForDay[0].y && placesForDay[0].x) {
        panTo({ lat: placesForDay[0].y, lng: placesForDay[0].x });
      }
      
      // 디버깅: GeoJSON 경로 세그먼트 정보 (수정됨)
      if (daySchedule.routeData?.segmentRoutes && daySchedule.routeData.segmentRoutes.length > 0) {
        console.log(`[MapContainer] 일차 ${selectedDay} 경로 세그먼트 수: ${daySchedule.routeData.segmentRoutes.length}`);
        daySchedule.routeData.segmentRoutes.forEach((segment, idx) => {
          console.log(`  세그먼트 ${idx + 1}: ${segment.from} -> ${segment.to}, 링크 ${segment.links.length}개`);
        });
      } else {
         console.log(`[MapContainer] 일차 ${selectedDay} 경로 세그먼트 정보 없음`);
      }


    } else if (itinerary.length > 0 && selectedDay === null) {
      // 일정이 있지만 선택된 날이 없을 경우 (예: 전체 일정 개요)
      // 모든 일정의 장소를 연한 색으로 표시하거나, 첫째날 기준으로 표시
      // 여기서는 첫째날 기준으로 표시하는 로직으로 대체
      const firstDaySchedule = itinerary[0];
      if (firstDaySchedule) {
        const markers = addMarkers(mapPlacesWithGeoNodes(firstDaySchedule.places), { useColorByCategory: true });
        setCurrentMarkers(markers);
        if (firstDaySchedule.places.length > 0 && firstDaySchedule.places[0].y && firstDaySchedule.places[0].x) {
          panTo({ lat: firstDaySchedule.places[0].y, lng: firstDaySchedule.places[0].x });
        }
      }
    }

  }, [
    map, 
    itinerary, 
    selectedDay, 
    addMarkers, 
    clearMapElements, 
    panTo, 
    renderItineraryRoute, 
    serverRoutesData, 
    renderGeoJsonRoute, 
    isGeoJsonLoaded, 
    mapPlacesWithGeoNodes,
    showRouteForPlaceIndex // 의존성 배열에 추가
  ]);

  // 2. 검색 결과(places) 또는 전체 선택된 장소(selectedPlaces) 변경 시 마커 업데이트
  // (일정이 없고, selectedDay가 null일 때만 동작)
  useEffect(() => {
    if (!map || (itinerary && itinerary.length > 0) || selectedDay !== null) {
      // 일정이 있거나 특정 일자가 선택된 경우, 위의 useEffect가 처리하므로 여기서는 무시
      return;
    }
    
    clearMapElements();

    let placesToDisplay: Place[] = [];
    let useRecommendedStyle = false;

    if (selectedPlaces && selectedPlaces.length > 0) {
      placesToDisplay = mapPlacesWithGeoNodes(selectedPlaces); // 후보 장소 포함 가능
      console.log("[MapContainer] 선택된 장소들(selectedPlaces) 마커 표시:", placesToDisplay.length, "개");
    } else if (places && places.length > 0) {
      placesToDisplay = mapPlacesWithGeoNodes(places); // 일반 검색 결과
      useRecommendedStyle = true; // 검색 결과는 추천 스타일 사용 가능
      console.log("[MapContainer] 일반 장소 목록(places) 마커 표시:", placesToDisplay.length, "개");
    }

    if (placesToDisplay.length > 0) {
      const markers = addMarkers(placesToDisplay, { 
        highlight: false, 
        useRecommendedStyle, 
        useColorByCategory: true, // 카테고리별 색상 항상 사용
        onClick: (place) => {
          toast.info(`장소: ${place.name}`);
          if (place.y && place.x) panTo({ lat: place.y, lng: place.x });
        }
      });
      setCurrentMarkers(markers);
      if (placesToDisplay[0].y && placesToDisplay[0].x) {
        panTo({ lat: placesToDisplay[0].y, lng: placesToDisplay[0].x });
      }
    }
  }, [map, places, selectedPlaces, itinerary, selectedDay, clearMapElements, addMarkers, panTo, mapPlacesWithGeoNodes]);


  // 3. 단일 선택된 장소(selectedPlace) 변경 시 처리 (리스트에서 항목 클릭 등)
  useEffect(() => {
    if (selectedPlace && selectedPlace.y && selectedPlace.x) {
      console.log("[MapContainer] 단일 선택된 장소로 이동:", selectedPlace.name);
      panTo({ lat: selectedPlace.y, lng: selectedPlace.x });
      // 필요하다면 이 장소만 특별히 하이라이트하는 로직 추가 가능
      // 예: 기존 마커 중 해당 장소 마커를 찾아 스타일 변경 또는 새 마커 추가 후 잠시 뒤 제거
    }
  }, [selectedPlace, panTo]);
  
  // Map 컴포넌트는 항상 렌더링, 실제 지도는 MapContext를 통해 제어
  return (
    <div className="w-full h-full">
      <Map /> {/* Map 컴포넌트는 Naver Map을 초기화하고 mapContainer ref를 제공 */}
    </div>
  );
};

export default MapContainer;
