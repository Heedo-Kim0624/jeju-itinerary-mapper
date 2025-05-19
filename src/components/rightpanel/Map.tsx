import React, { useEffect, useState } from 'react';
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
  selectedItineraryDay: ItineraryDay | null;
  isGeneratingSchedule?: boolean;
  selectedPlacesForMap?: Place[];
  onMapPlaceClick?: (place: Place, index: number) => void;
  highlightPlaceIdFromSearch?: string;
}

const Map: React.FC<MapProps> = ({ 
  places, 
  selectedPlace, 
  itinerary, 
  selectedItineraryDay,
  isGeneratingSchedule = false,
  selectedPlacesForMap = [],
  onMapPlaceClick,
  highlightPlaceIdFromSearch,
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
    renderItineraryRoute,
    clearAllMapElements,
    addMarkers,
    clearAllRoutes,
    clearAllMarkers,
  } = useMapContext();

  const {
    itinerary: visualizedItinerary,
    currentDay: visualizedCurrentDay,
    totalDistance: visualizedTotalDistance,
    visualizeDayRoute,
  } = useMapItineraryVisualization(map, geoJsonNodes, geoJsonLinks);

  useEffect(() => {
    if (isGeneratingSchedule && isMapInitialized) {
      console.log("[Map] 일정 생성 시작. 지도 요소 초기화.");
      clearAllMapElements();
    }
  }, [isGeneratingSchedule, isMapInitialized, clearAllMapElements]);

  useEffect(() => {
    if (!isMapInitialized || !isNaverLoaded) return;

    clearAllMapElements();

    if (selectedItineraryDay) {
      console.log(`[Map] 선택된 날짜 변경: ${selectedItineraryDay.day}일차. 마커 및 경로 업데이트.`);
      
      if (selectedItineraryDay.places && selectedItineraryDay.places.length > 0) {
        console.log(`[Map] ${selectedItineraryDay.day}일차 장소 ${selectedItineraryDay.places.length}개 마커 표시 시도.`);
        addMarkers(selectedItineraryDay.places, { 
          isItinerary: true, 
          useColorByCategory: true,
          itineraryOrder: true,
          onMarkerClick: onMapPlaceClick
        });
      } else {
        console.log(`[Map] ${selectedItineraryDay.day}일차 표시할 장소 없음.`);
      }

      if (!showGeoJson && isGeoJsonLoaded) {
         console.log("[Map] 경로 표시를 위해 GeoJSON 레이어 활성화 시도.");
         toggleGeoJsonVisibility(); 
      }
      
      renderItineraryRoute(selectedItineraryDay, undefined, () => {
        console.log(`[Map] ${selectedItineraryDay.day}일차 경로 시각화 완료.`);
      });

    } else if (!isGeneratingSchedule) {
      console.log("[Map] 선택된 날짜 없음. 일반 장소/검색 결과 마커 표시 (해당하는 경우).");
    }

  }, [
    selectedItineraryDay, 
    isMapInitialized, 
    isNaverLoaded,
    addMarkers, 
    renderItineraryRoute, 
    clearAllMapElements,
    showGeoJson,
    isGeoJsonLoaded,
    toggleGeoJsonVisibility,
    onMapPlaceClick,
  ]);

  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      toast.success('경로 데이터가 지도에 표시됩니다');
    }
  }, [isGeoJsonLoaded, showGeoJson]);

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

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      
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
