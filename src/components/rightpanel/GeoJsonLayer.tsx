import { useEffect } from 'react';
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
import GeoJsonRenderer from './geojson/GeoJsonRenderer';
import { GeoJsonLayerProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes';

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  map,
  visible,
  isMapInitialized,
  isNaverLoaded,
  onGeoJsonLoaded
}) => {
  // GeoJSON 상태 관리 훅 사용
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

  // 데이터 로드 성공 시 콜백 호출
  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);
  
  // 전역 인터페이스 등록
  useEffect(() => {
    if (map && isLoaded && nodes.length > 0 && links.length > 0) {
      // registerGlobalInterface from useGeoJsonState likely needs nodes/links if it's creating
      // getNodeById/getLinkById. GeoJsonRenderer also has its own useEffect to set window.geoJsonLayer.
      // This could be a source of conflict or redundancy.
      // For now, let's assume GeoJsonRenderer is the primary source for window.geoJsonLayer.
      // The call to registerGlobalInterface() from useGeoJsonState might need adjustment
      // if it also tries to set window.geoJsonLayer.
      // Based on the previous code, GeoJsonRenderer sets window.geoJsonLayer.
      // The registerGlobalInterface from useGeoJsonState might be for something else or an alternative.
    }
  }, [map, isLoaded, nodes, links, registerGlobalInterface]);

  return (
    <>
      {/* 데이터 로더 컴포넌트 */}
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
      
      {/* 데이터 렌더러 컴포넌트 */}
      {isLoaded && (
        <GeoJsonRenderer
          map={map}
          visible={visible}
          nodes={nodes}
          links={links}
          onDisplayedFeaturesChange={handleDisplayedFeaturesChange}
        />
      )}
      
      {/* 로딩 상태 표시 */}
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {/* 오류 상태 표시 */}
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
