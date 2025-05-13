
import React, { useEffect } from 'react';
import { useMapContext } from './MapContext';
import MapMarkers from './MapMarkers';
import MapLoadingOverlay from './MapLoadingOverlay';
import GeoJsonLayer from './GeoJsonLayer';
import MapControls from './MapControls';
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
    isGeoJsonLoaded
  } = useMapContext();

  // GeoJSON이 로드되면 사용자에게 알림
  useEffect(() => {
    if (isGeoJsonLoaded && showGeoJson) {
      toast.success('경로 데이터가 지도에 표시됩니다');
    }
  }, [isGeoJsonLoaded, showGeoJson]);

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
