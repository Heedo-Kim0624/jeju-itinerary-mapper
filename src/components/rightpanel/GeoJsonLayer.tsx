import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { useGeoJsonState } from '@/hooks/map/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
import { GeoJsonLayerProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes';

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
    clearDisplayedFeatures,
  } = useGeoJsonState(map);

  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);

  useEffect(() => {
    if (!isLoaded || !clearDisplayedFeatures) return;

    if (!visible) {
      console.log('[GeoJsonLayer] Layer is now hidden. Clearing displayed GeoJSON features.');
      clearDisplayedFeatures();
    }
  }, [visible, isLoaded, clearDisplayedFeatures]);

  return (
    <>
      {(!isLoaded && !error) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
            handleLoadSuccess(loadedNodes, loadedLinks);
            if (visible && !isLoading) { 
              toast.success('경로 데이터가 로드되었습니다.');
            }
          }}
          onLoadError={handleLoadError}
        />
      )}
      
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패: {error.message}
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
