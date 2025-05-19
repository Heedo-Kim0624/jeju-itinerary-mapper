
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
// Place, ItineraryDay 타입을 @/types/index.ts 에서 가져오도록 수정
import type { Place, ItineraryDay } from '@/types';
import { toast } from 'sonner';
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
import DaySelectorMapOverlay from '@/components/map/DaySelector';
import { extractAllNodesFromRoute, extractAllLinksFromRoute } from '@/utils/routeParser';


interface MapProps {
  places: Place[]; // Place[] 타입 사용
  selectedPlace: Place | null; // Place | null 타입 사용
  itinerary: ItineraryDay[] | null; // ItineraryDay[] 타입 사용
  selectedDay: number | null;
  selectedPlaces?: Place[]; // Place[] 타입 사용
}

const Map: React.FC<MapProps> = ({ 
  places, 
  selectedPlace, 
  itinerary, // 이 itinerary는 useScheduleManagement로부터 온 파싱된 ItineraryDay[]
  selectedDay,
  selectedPlaces = [] 
}) => {
  const {
    mapContainer,
    map,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    showGeoJson,
    toggleGeoJsonVisibility,
    handleGeoJsonLoaded,
    isGeoJsonLoaded,
    checkGeoJsonMapping,
    serverRoutesData, // Record<number, ServerRouteResponse>
    geoJsonNodes,
    geoJsonLinks,
    renderItineraryRoute, // MapContext에서 제공하는 renderItineraryRoute
    renderGeoJsonRoute // 추가: GeoJson 경로 직접 렌더링
  } = useMapContext();

  // useMapItineraryVisualization는 이제 표시 로직만 담당, 데이터는 props 또는 context에서
  // 이 훅은 서버 응답을 직접 파싱하지 않고, 이미 파싱된 ItineraryDay[]를 받아 시각화에 사용
  const {
    visualizeItineraryDay, // 함수명 변경: visualizeDayRoute -> visualizeItineraryDay
    clearAllVisualizations, // 모든 시각화 요소 제거 함수
    currentVisualizedDay, // 현재 시각화된 날짜
    // totalDistance는 ItineraryDay 자체에 있으므로 여기서 따로 관리 안 함
  } = useMapItineraryVisualization({ // 옵션 객체로 전달
    map, 
    geoJsonNodes, 
    geoJsonLinks,
    renderGeoJsonRoute // GeoJSON 경로 렌더링 함수 전달
  });


  // GeoJSON이 로드되면 사용자에게 알림
  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      // toast.success('경로 데이터가 지도에 표시됩니다'); // 너무 빈번할 수 있음
    }
  }, [isGeoJsonLoaded, showGeoJson]);

  // 선택된 날짜의 일정이 변경되면 해당 경로 시각화
  useEffect(() => {
    if (isMapInitialized && itinerary && selectedDay !== null) {
      const dayToVisualize = itinerary.find(d => d.day === selectedDay);
      if (dayToVisualize) {
        console.log(`[Map.tsx] ${selectedDay}일차 경로 시각화 요청`);
        
        // visualizeItineraryDay는 ItineraryDay 객체를 받아 내부의 interleaved_route 또는 routeData를 사용
        visualizeItineraryDay(dayToVisualize); 
        
        if (isGeoJsonLoaded && !showGeoJson) {
          console.log("[Map.tsx] 경로 데이터가 있고 GeoJSON 로드됨. GeoJSON 표시 활성화 시도.");
          toggleGeoJsonVisibility();
        }
      } else {
        console.log(`[Map.tsx] ${selectedDay}일차 데이터 없음. 시각화 초기화.`);
        clearAllVisualizations();
      }
    } else if (isMapInitialized && !selectedDay) {
      clearAllVisualizations(); // 선택된 날짜가 없으면 모든 시각화 제거
    }
  }, [isMapInitialized, itinerary, selectedDay, visualizeItineraryDay, clearAllVisualizations, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility]);


  // 서버 경로 데이터 로깅 (serverRoutesData는 MapContext를 통해 useMapCore에서 설정됨)
  useEffect(() => {
    if (Object.keys(serverRoutesData).length > 0) {
      console.log("[Map.tsx] 서버 경로 데이터 업데이트됨 (from context):", {
        일수: Object.keys(serverRoutesData).length,
        첫날_노드수: serverRoutesData[1]?.nodeIds?.length || 0,
        첫날_링크수: serverRoutesData[1]?.linkIds?.length || 0,
      });
      // GeoJSON 자동 활성화 로직은 selectedDay 변경 useEffect에서 처리
    }
  }, [serverRoutesData]);

  // 장소와 GeoJSON 매핑 검사
  useEffect(() => {
    if (isGeoJsonLoaded && places.length > 0 && isMapInitialized) {
      const timer = setTimeout(() => {
        const mappingResult = checkGeoJsonMapping(places); // places는 Place[]
        console.log('[Map.tsx] GeoJSON 매핑 결과:', mappingResult);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isGeoJsonLoaded, places, isMapInitialized, checkGeoJsonMapping]);

  const handlePlaceClickOnMap = (place: Place, index: number) => { // Place 타입 사용
    console.log(`[Map.tsx] 장소 클릭됨 (MapMarkers로부터): ${place.name} (${index + 1}번)`);
    // 추가 로직 (예: 정보 창 표시, 해당 장소로 panTo 등)
  };
  
  const currentItineraryDayForOverlay = itinerary?.find(d => d.day === (currentVisualizedDay ?? selectedDay));

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        places={places} // Place[] 타입
        selectedPlace={selectedPlace} // Place | null 타입
        // MapMarkers는 props.itinerary를 받아 직접 renderItineraryRoute 호출
        // 또는, 시각화가 useMapItineraryVisualization에 의해 완전히 처리된다면,
        // MapMarkers는 순수 마커 표시만 담당하고 경로 표시는 Map.tsx에서 직접 제어
        itinerary={itinerary} 
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces as Place[]} // SelectedPlace[]를 Place[]로 단언
        onPlaceClick={handlePlaceClickOnMap}
      />
      
      {map && (
        <GeoJsonLayer 
          map={map} 
          visible={showGeoJson} 
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={handleGeoJsonLoaded} // GeoJSON 데이터 로드 완료 시 콜백
        />
      )}
      
      {isMapInitialized && itinerary && itinerary.length > 0 && currentItineraryDayForOverlay && (
        <DaySelectorMapOverlay
          itinerary={itinerary} // 전체 일정 전달
          currentDay={currentVisualizedDay ?? selectedDay} // 현재 표시 중인 날짜
          onDaySelect={(dayNum) => {
             // DaySelector에서 날짜 선택 시, 해당 날짜의 ItineraryDay를 찾아 시각화
             const dayToVis = itinerary.find(d => d.day === dayNum);
             if (dayToVis) visualizeItineraryDay(dayToVis);
             // selectedDay 상태도 업데이트 필요 (부모 컴포넌트에서 관리)
             // 이 컴포넌트는 표시용이므로, 상태 변경은 부모에게 위임하는 것이 좋음
             // 예: onDaySelect={(dayNum) => onSelectDayProp(dayNum)}
          }}
          totalDistance={currentItineraryDayForOverlay.totalDistance} // 현재 날짜의 총 거리
        />
      )}
      
      <MapControls
        showGeoJson={showGeoJson}
        onToggleGeoJson={toggleGeoJsonVisibility}
        isMapInitialized={isMapInitialized}
        isGeoJsonLoaded={isGeoJsonLoaded}
      />
      
      <MapLoadingOverlay
        isNaverLoaded={isNaverLoaded}
        isMapError={isMapError}
      />
    </div>
  );
};

export default Map;
