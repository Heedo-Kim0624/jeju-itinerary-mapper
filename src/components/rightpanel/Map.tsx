
import React, { useMemo } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
import type { Place, ItineraryDay, ItineraryPlaceWithTime } from '@/types/core'; // ItineraryPlaceWithTime 추가
import { useMapDataEffects } from '@/hooks/map/useMapDataEffects';

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
    renderItineraryRoute, // renderItineraryRoute 직접 가져오기
    serverRoutesData, // serverRoutesData 직접 가져오기
  } = useMapContext();

  // 현재 선택된 일자의 itinerary 데이터
  const currentDayItinerary = useMemo(() => {
    if (itinerary && selectedDay !== null) {
      return itinerary.find(day => day.day === selectedDay);
    }
    return null;
  }, [itinerary, selectedDay]);

  // 현재 선택된 일자의 places만 추출
  // ItineraryPlaceWithTime[] 또는 Place[] 타입을 명시적으로 지정
  const currentDayPlaces = useMemo((): ItineraryPlaceWithTime[] | Place[] => {
    if (currentDayItinerary && currentDayItinerary.places && currentDayItinerary.places.length > 0) {
      return currentDayItinerary.places;
    }
    return places; // fallback to general places when no itinerary day is selected
  }, [currentDayItinerary, places]);

  const { handlePlaceClick } = useMapDataEffects({
    isMapInitialized,
    isGeoJsonLoaded,
    renderItineraryRoute, // 컨텍스트에서 직접 가져온 함수 사용
    serverRoutesData, // 컨텍스트에서 직접 가져온 데이터 사용
    checkGeoJsonMapping,
    places, // 일반 장소 목록 전달
    itinerary,
    selectedDay,
  });

  // MapMarkers에 대한 고유 키 생성 - 의존성 배열 확장
  const markersKey = useMemo(() => {
    // currentDayPlaces가 Place[] 또는 ItineraryPlaceWithTime[] 일 수 있으므로, 타입 가드 없이 id 접근
    const placesId = currentDayPlaces.map(p => p.id).join('_') || 'empty';
    
    const itineraryId = itinerary && itinerary.length > 0 && itinerary[0] ? 
      `${itinerary.length}-${itinerary[0].day}-${itinerary[0].date}` : 
      'no-itinerary';
      
    const dayId = selectedDay !== null ? `day-${selectedDay}` : 'no-day';
    const selectedPlaceId = selectedPlace ? `place-${selectedPlace.id}` : 'no-selected';
    const selectedPlacesIds = (selectedPlaces && selectedPlaces.length > 0) ? selectedPlaces.map(p => p.id).join('_') : 'no-selected-places';
    
    return `markers-${dayId}-${itineraryId}-${placesId}-${selectedPlaceId}-${selectedPlacesIds}`;
  }, [currentDayPlaces, itinerary, selectedDay, selectedPlace, selectedPlaces]);

  const stableSelectedPlaces = useMemo(() => selectedPlaces || [], [selectedPlaces]);

  return (
    <div ref={mapContainer} className="w-full h-full relative flex-grow">
      <MapMarkers
        key={markersKey}
        // places prop은 Place[] 타입이어야 하므로, currentDayPlaces를 Place[]로 캐스팅하거나 타입을 맞춰야합니다.
        // MapMarkers는 Place[]를 받도록 되어 있으므로, currentDayPlaces가 ItineraryPlaceWithTime[]이면 변환 또는 캐스팅 필요
        // 여기서는 currentDayPlaces가 Place[]의 부분집합이라고 가정하고 전달합니다.
        // 만약 ItineraryPlaceWithTime의 추가 속성이 MapMarkers에서 필요하다면 MapMarkers의 props 타입 수정 필요
        places={selectedDay !== null ? (currentDayPlaces as Place[]) : places}
        selectedPlace={selectedPlace}
        itinerary={itinerary}
        selectedDay={selectedDay}
        selectedPlaces={stableSelectedPlaces}
        onPlaceClick={handlePlaceClick as (place: Place | ItineraryPlaceWithTime, index: number) => void} // 타입 단언 추가
        highlightPlaceId={selectedPlace?.id}
        // showOnlyCurrentDayMarkers={true} // 이 prop은 MapMarkersProps에 없으므로 제거
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

