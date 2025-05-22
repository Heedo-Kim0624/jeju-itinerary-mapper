
import { useEffect } from 'react';
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState'; // This is src/components/rightpanel/geojson/useGeoJsonState
import GeoJsonLoader from './geojson/GeoJsonLoader';
import GeoJsonRenderer from './geojson/GeoJsonRenderer';
import { GeoJsonLayerProps } from './geojson/GeoJsonTypes';

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  map,
  visible,
  isMapInitialized,
  isNaverLoaded,
  onGeoJsonLoaded
}) => {
  // GeoJSON 상태 관리 훅 사용 (from ./geojson/useGeoJsonState)
  const {
    isLoading,
    error,
    isLoaded,
    nodes,
    links,
    handleLoadSuccess, // This is passed to GeoJsonLoader
    handleLoadError,   // This is passed to GeoJsonLoader
    // handleDisplayedFeaturesChange, // Removed
    // registerGlobalInterface // Removed, handled internally by the hook
  } = useGeoJsonState(map);

  // 데이터 로드 성공 시 콜백 호출
  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);
  
  // 전역 인터페이스 등록은 useGeoJsonState 내부의 useEffect에서 처리됩니다.
  // useEffect(() => {
  //   if (isMapInitialized && isNaverLoaded && isLoaded) {
  //     return registerGlobalInterface(); // Removed
  //   }
  // }, [isMapInitialized, isNaverLoaded, isLoaded, registerGlobalInterface]);

  return (
    <>
      {/* 데이터 로더 컴포넌트 */}
      {(!isLoaded && !error) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes, loadedLinks) => { // Renamed for clarity from original context
            handleLoadSuccess(loadedNodes, loadedLinks); // Call the function from the hook
            if (visible) {
              toast.success('경로 데이터가 로드되었습니다.');
            }
          }}
          onLoadError={handleLoadError} // Call the function from the hook
        />
      )}
      
      {/* 데이터 렌더러 컴포넌트 */}
      {isLoaded && map && ( // Ensure map is also available for renderer
        <GeoJsonRenderer
          map={map}
          visible={visible}
          nodes={nodes}
          links={links}
          // onDisplayedFeaturesChange={handleDisplayedFeaturesChange} // Removed
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

