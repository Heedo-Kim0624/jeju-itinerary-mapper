
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
// GeoJsonRenderer import removed
import { GeoJsonLayerProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes'; // Added GeoNode, GeoLink for onGeoJsonLoaded

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  map,
  visible,
  isMapInitialized,
  isNaverLoaded,
  onGeoJsonLoaded
}) => {
  const {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess,
    handleLoadError,
    clearDisplayedFeatures, // Destructure from useGeoJsonState
  } = useGeoJsonState(map);

  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);

  // Effect to handle the 'visible' prop for the layer
  useEffect(() => {
    // Only act if GeoJSON data is loaded and hooks are initialized
    if (!isLoaded || !clearDisplayedFeatures) return;

    if (!visible) {
      console.log('[GeoJsonLayer] Layer is now hidden. Clearing displayed GeoJSON features.');
      clearDisplayedFeatures();
    }
    // If 'visible' becomes true, features are not automatically re-rendered here.
    // Routes are expected to be rendered on-demand via window.geoJsonLayer.renderRoute()
    // or other map interaction logic.
  }, [visible, isLoaded, clearDisplayedFeatures]);

  return (
    <>
      {/* Data loader component */}
      {(!isLoaded && !error) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => { // Ensure types are explicit
            handleLoadSuccess(loadedNodes, loadedLinks);
            // Check current visibility before showing toast for initial load
            if (visible && !isLoading) { 
              toast.success('경로 데이터가 로드되었습니다.');
            }
          }}
          onLoadError={handleLoadError}
        />
      )}
      
      {/* GeoJsonRenderer component usage removed */}
      
      {/* Loading state 표시 */}
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {/* 오류 상태 표시 */}
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패: {error.message}
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
