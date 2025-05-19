
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';
import { useMapItineraryVisualization } from '@/hooks/map/useMapItineraryVisualization';
import DaySelectorMapOverlay from '@/components/map/DaySelector';

interface MapProps {
  places: Place[];
  selectedPlace: Place | null;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  selectedPlaces?: Place[];
}

const Map: React.FC<MapProps> = ({ 
  places, 
  selectedPlace, 
  itinerary, 
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
    serverRoutesData,
    geoJsonNodes,
    geoJsonLinks,
    renderItineraryRoute,
    clearAllRoutes
  } = useMapContext();

  const {
    itinerary: visualizedItinerary,
    currentDay: visualizedCurrentDay,
    totalDistance: visualizedTotalDistance,
    visualizeDayRoute,
  } = useMapItineraryVisualization(map, geoJsonNodes, geoJsonLinks);

  // GeoJSON이 로드되면 사용자에게 알림
  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      toast.success('경로 데이터가 지도에 표시됩니다');
    }
  }, [isGeoJsonLoaded, showGeoJson]);

  // 일정 데이터가 변경될 때 경로 시각화
  useEffect(() => {
    if (isMapInitialized && isGeoJsonLoaded && itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData) {
        console.log(`[Map] 선택된 ${selectedDay}일차 일정 경로 시각화 중...`);
        
        // GeoJSON 표시 활성화
        if (!showGeoJson) {
          console.log("[Map] GeoJSON 표시를 활성화합니다.");
          toggleGeoJsonVisibility();
        }
        
        // 지도에 경로 표시
        renderItineraryRoute(currentDayData, serverRoutesData, () => {}, clearAllRoutes);
      }
    }
  }, [itinerary, selectedDay, isMapInitialized, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility, renderItineraryRoute, serverRoutesData, clearAllRoutes]);

  // 서버 경로 데이터가 변경될 때마다 로그 출력 및 처리
  useEffect(() => {
    if (Object.keys(serverRoutesData).length > 0) {
      console.log("[Map] 서버 경로 데이터가 업데이트됨:", {
        일수: Object.keys(serverRoutesData).length,
        첫날_노드: serverRoutesData[1]?.nodeIds?.length || 0,
        첫날_링크: serverRoutesData[1]?.linkIds?.length || 0,
        첫날_인터리브드: !!serverRoutesData[1]?.interleaved_route
      });
      
      if (isGeoJsonLoaded && !showGeoJson) {
        console.log("[Map] 서버 경로 데이터가 있어 GeoJSON 표시를 활성화합니다.");
        toggleGeoJsonVisibility();
      }
      
      // 현재 선택된 날짜가 있으면 해당 날짜의 경로 시각화
      if (selectedDay !== null && itinerary && itinerary.length > 0) {
        const currentDayData = itinerary.find(day => day.day === selectedDay);
        if (currentDayData) {
          console.log(`[Map] 서버 경로 데이터 업데이트 후 ${selectedDay}일차 일정 경로 시각화 중...`);
          renderItineraryRoute(currentDayData, serverRoutesData, () => {}, clearAllRoutes);
        }
      }
    }
  }, [serverRoutesData, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility, selectedDay, itinerary, renderItineraryRoute, clearAllRoutes]);

  // 장소와 GeoJSON 매핑 검사
  useEffect(() => {
    if (isGeoJsonLoaded && places.length > 0 && isMapInitialized) {
      const timer = setTimeout(() => {
        const mappingResult = checkGeoJsonMapping(places);
        console.log('[Map] GeoJSON 매핑 결과:', mappingResult);
        
        if (mappingResult.success) {
          console.log(`✅ [Map] 장소-GeoJSON 매핑 성공: ${mappingResult.mappedPlaces}/${mappingResult.totalPlaces} 장소, 평균 거리: ${mappingResult.averageDistance}m`);
        } else {
          console.warn(`⚠️ [Map] 장소-GeoJSON 매핑 부족: ${mappingResult.mappingRate} 매핑됨, 평균 거리: ${mappingResult.averageDistance}m`);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isGeoJsonLoaded, places, isMapInitialized, checkGeoJsonMapping]);

  const handlePlaceClick = (place: Place, index: number) => {
    console.log(`[Map] 장소 클릭됨: ${place.name} (${index + 1}번)`);
    // 선택된 일정이 있고 현재 선택된 날짜가 있으면 해당 장소의 경로를 하이라이트
    if (itinerary && itinerary.length > 0 && selectedDay !== null) {
      const currentDayData = itinerary.find(day => day.day === selectedDay);
      if (currentDayData) {
        const placeIndex = currentDayData.places.findIndex(p => p.id === place.id);
        if (placeIndex !== -1) {
          console.log(`[Map] 일정 내 장소 클릭: ${place.name} (일차: ${selectedDay}, 인덱스: ${placeIndex})`);
          // 여기서 필요한 하이라이트 로직 호출 가능
        }
      }
    }
  };

  const isNewVisualizationActive = visualizedItinerary && visualizedItinerary.length > 0;

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        places={places}
        selectedPlace={selectedPlace}
        itinerary={isNewVisualizationActive ? null : itinerary}
        selectedDay={isNewVisualizationActive ? null : selectedDay}
        selectedPlaces={selectedPlaces}
        onPlaceClick={handlePlaceClick}
      />
      
      {map && (
        <GeoJsonLayer 
          map={map} 
          visible={showGeoJson} 
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onGeoJsonLoaded={handleGeoJsonLoaded}
        />
      )}
      
      {isMapInitialized && visualizedItinerary.length > 0 && (
        <DaySelectorMapOverlay
          itinerary={visualizedItinerary}
          currentDay={visualizedCurrentDay}
          onDaySelect={visualizeDayRoute}
          totalDistance={visualizedTotalDistance}
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
