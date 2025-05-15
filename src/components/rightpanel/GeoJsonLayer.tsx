
import React, { useEffect } from 'react'; // React 임포트
import { toast } from 'sonner';
import useGeoJsonState from './geojson/useGeoJsonState'; // 올바른 경로
import GeoJsonLoader from './geojson/GeoJsonLoader';
import GeoJsonRenderer from './geojson/GeoJsonRenderer';
import { GeoJsonLayerProps } from './geojson/GeoJsonTypes'; // 올바른 경로

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  map,
  visible, // 이 visible 상태가 GeoJsonRenderer로 전달되어 전체 노드/링크 표시 여부 결정
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
    handleDisplayedFeaturesChange, // GeoJsonRenderer에 전달 가능
    registerGlobalInterface,
    // renderAllFeatures // useGeoJsonState에서 직접 호출하지 않고, Renderer가 visible 상태에 따라 처리
  } = useGeoJsonState(map);

  useEffect(() => {
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);
  
  useEffect(() => {
    if (isMapInitialized && isNaverLoaded && isLoaded) { // isLoaded 조건 추가
      const unregister = registerGlobalInterface(); // unregister 함수 받기
      return () => { // cleanup 함수
        unregister();
      };
    }
  }, [isMapInitialized, isNaverLoaded, isLoaded, registerGlobalInterface]);

  // isLoaded가 true이고 visible이 true일 때 모든 GeoJSON 데이터를 표시하도록 GeoJsonRenderer에 위임
  // GeoJsonRenderer 내부에서 nodes와 links를 받아 visible 상태에 따라 전체를 렌더링

  return (
    <>
      {(!isLoaded && !error && isMapInitialized && isNaverLoaded) && ( // 로더는 맵 초기화 후 표시
        <GeoJsonLoader
          isMapInitialized={isMapInitialized} // 전달
          isNaverLoaded={isNaverLoaded} // 전달
          onLoadSuccess={(loadedNodes, loadedLinks) => {
            handleLoadSuccess(loadedNodes, loadedLinks);
            // 로드 성공 시 토스트는 옵션 (너무 자주 뜰 수 있음)
            // if (visible) toast.success('경로 네트워크 데이터가 로드되었습니다.');
          }}
          onLoadError={handleLoadError}
        />
      )}
      
      {isLoaded && map && ( // isLoaded 이고 map이 있을 때만 렌더러 표시
        <GeoJsonRenderer
          map={map}
          visible={visible} // 이 prop에 따라 전체 노드/링크 표시
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
      
      {error && !isLoading && ( // 에러 발생하고 로딩 중 아닐 때
        <div className="absolute bottom-16 left-4 bg-red-100 text-red-700 border border-red-300 backdrop-blur-sm p-2 rounded-md text-sm shadow-lg">
          네트워크 데이터 로드 실패: {error.message}
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
