
import React, { useState } from 'react';
import { useJejuMap } from '@/hooks/use-jeju-map';
import { useJejuBoundaryLayer } from './useJejuBoundaryLayer';
import { useJejuLandmarks } from './useJejuLandmarks';
import JejuInfoPanel from './JejuInfoPanel';
import JejuMapControls from './JejuMapControls';
import JejuLoadingState from './JejuLoadingState';

interface JejuVisualizerProps {
  className?: string;
}

const JejuVisualizer: React.FC<JejuVisualizerProps> = ({ className }) => {
  const {
    mapContainer,
    map,
    markers,
    polylines,
    infoWindows,
    isMapInitialized,
    isNaverLoaded,
    isMapError,
    activeMarker,
    setActiveMarker,
    showInfoPanel,
    setShowInfoPanel,
    clearMarkersAndInfoWindows
  } = useJejuMap();
  
  // Use the boundary layer hook
  useJejuBoundaryLayer(map, isMapInitialized, markers);
  
  // Use the landmarks hook
  useJejuLandmarks(map, isMapInitialized, markers, infoWindows, setActiveMarker);

  const moveToLocation = (lat: number, lng: number, name: string) => {
    if (!map || !window.naver) return;
    
    const position = new window.naver.maps.LatLng(lat, lng);
    
    map.setCenter(position);
    map.setZoom(14);
    
    const markerIndex = JEJU_LANDMARKS.findIndex(lm => lm.name === name);
    if (markerIndex >= 0 && markers.current[markerIndex + 1]) {
      infoWindows.current.forEach(iw => iw.close());
      infoWindows.current[markerIndex].open(map, markers.current[markerIndex + 1]);
    }
  };

  const setMapType = (mapType: string) => {
    if (!map || !window.naver || !window.naver.maps) return;
    map.setMapTypeId(window.naver.maps.MapTypeId[mapType]);
  };

  if (!isNaverLoaded || isMapError) {
    return <JejuLoadingState isMapError={isMapError} className={className} />;
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div 
        ref={mapContainer} 
        className="absolute inset-0 rounded-lg overflow-hidden bg-blue-50" 
      />
      
      {!isMapInitialized && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="font-medium">제주도 지도를 초기화하는 중...</p>
          </div>
        </div>
      )}
      
      {showInfoPanel && isMapInitialized && (
        <JejuInfoPanel onSelectLocation={moveToLocation} />
      )}
      
      <JejuMapControls 
        onToggleInfoPanel={() => setShowInfoPanel(!showInfoPanel)}
        showInfoPanel={showInfoPanel}
        setMapType={setMapType}
        isNaverLoaded={isNaverLoaded}
      />
    </div>
  );
};

// Import here to avoid circular dependency
import { JEJU_LANDMARKS } from '@/utils/jejuMapStyles';

export default JejuVisualizer;
