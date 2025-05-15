import { useEffect } from 'react';
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
import GeoJsonRenderer from './geojson/GeoJsonRenderer';
import { GeoJsonLayerComponentProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes';

const GeoJsonLayer: React.FC<GeoJsonLayerComponentProps> = ({
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
    registerGlobalInterface
  } = useGeoJsonState(map);

  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);
  
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded && isLoaded) {
      return registerGlobalInterface();
    }
  }, [isMapInitialized, isNaverLoaded, isLoaded, registerGlobalInterface]);

  return (
    <>
      {(!isLoaded && !error) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
            handleLoadSuccess(loadedNodes, loadedLinks);
            if (visible) {
              toast.success('경로 데이터가 로드되었습니다.');
            }
          }}
          onLoadError={handleLoadError}
        />
      )}
      
      {isLoaded && (
        <GeoJsonRenderer
          map={map}
          visible={visible}
          nodes={nodes}
          links={links}
          onDisplayedFeaturesChange={handleDisplayedFeaturesChange}
        />
      )}
      
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
