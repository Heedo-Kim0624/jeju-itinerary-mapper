
import React, { useEffect } from 'react';
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
import GeoJsonRenderer from './geojson/GeoJsonRenderer';
import { GeoJsonLayerProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes'; // GeoJsonLayerProps should be defined

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
    handleDisplayedFeaturesChange,
    registerGlobalInterface,
  } = useGeoJsonState(map);

  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);
  
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded && isLoaded) {
      const unregister = registerGlobalInterface();
      return () => {
        unregister();
      };
    }
  }, [isMapInitialized, isNaverLoaded, isLoaded, registerGlobalInterface]);

  return (
    <>
      {(!isLoaded && !error && isMapInitialized && isNaverLoaded) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => { // Type params
            handleLoadSuccess(loadedNodes, loadedLinks);
          }}
          onLoadError={handleLoadError}
        />
      )}
      
      {isLoaded && map && (
        <GeoJsonRenderer
          map={map}
          visible={visible}
          nodes={nodes}
          links={links}
          onDisplayedFeaturesChange={handleDisplayedFeaturesChange}
        />
      )}
      
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm shadow-lg">
          네트워크 데이터 로드 중...
        </div>
      )}
      
      {error && !isLoading && (
        <div className="absolute bottom-16 left-4 bg-red-100 text-red-700 border border-red-300 backdrop-blur-sm p-2 rounded-md text-sm shadow-lg">
          네트워크 데이터 로드 실패: {error.message}
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
