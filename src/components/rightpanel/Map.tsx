
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import JejuOSMLayer from './JejuOSMLayer';
import type { Place, ItineraryDay } from '@/types/supabase';
import { toast } from 'sonner';

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
    checkGeoJsonMapping
  } = useMapContext();

  // GeoJSON이 로드되면 사용자에게 알림
  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      toast.success('경로 데이터가 지도에 표시됩니다');
    }
  }, [isGeoJsonLoaded, showGeoJson]);

  // 일정을 선택했을 때 GeoJSON 자동 활성화
  useEffect(() => {
    if (isGeoJsonLoaded && itinerary && selectedDay !== null) {
      console.log("일정이 선택되었습니다. GeoJSON 표시를 활성화합니다.");
      // toggleGeoJsonVisibility를 직접 호출하면 상태가 토글되기 때문에
      // 이미 표시 중이라면 아무 작업도 하지 않도록 조건문 추가
      if (!showGeoJson) {
        toggleGeoJsonVisibility();
      }
    }
  }, [itinerary, selectedDay, isGeoJsonLoaded, showGeoJson, toggleGeoJsonVisibility]);

  // 장소와 GeoJSON 매핑 검사
  useEffect(() => {
    if (isGeoJsonLoaded && places.length > 0 && isMapInitialized) {
      // 지연 실행으로 UI 블로킹 방지
      const timer = setTimeout(() => {
        const mappingResult = checkGeoJsonMapping(places);
        console.log('GeoJSON 매핑 결과:', mappingResult);
        
        if (mappingResult.success) {
          console.log(`✅ 장소-GeoJSON 매핑 성공: ${mappingResult.mappedPlaces}/${mappingResult.totalPlaces} 장소, 평균 거리: ${mappingResult.averageDistance}m`);
        } else {
          console.warn(`⚠️ 장소-GeoJSON 매핑 부족: ${mappingResult.mappingRate} 매핑됨, 평균 거리: ${mappingResult.averageDistance}m`);
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [isGeoJsonLoaded, places, isMapInitialized, checkGeoJsonMapping]);

  // 장소 클릭 핸들러
  const handlePlaceClick = (place: Place, index: number) => {
    console.log(`장소 클릭됨: ${place.name} (${index + 1}번)`);
    // 추가적인 상호작용 로직을 여기에 구현할 수 있습니다.
  };

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        places={places}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={selectedPlaces}
        onPlaceClick={handlePlaceClick}
      />
      
      {map && (
        <>
          {/* JejuOSMLayer 통합 - 기본 레이어로 추가 */}
          <JejuOSMLayer map={map} />
          
          {/* GeoJsonLayer는 경로 표시를 위한 상호작용용 레이어로 유지 */}
          <GeoJsonLayer 
            map={map} 
            visible={showGeoJson} 
            isMapInitialized={isMapInitialized}
            isNaverLoaded={isNaverLoaded}
            onGeoJsonLoaded={handleGeoJsonLoaded}
          />
        </>
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
