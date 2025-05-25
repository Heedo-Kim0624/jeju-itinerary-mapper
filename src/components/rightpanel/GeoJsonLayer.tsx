
import React, { useEffect } from 'react';
import { toast } from 'sonner';
// 컴포넌트 레벨의 GeoJSON 상태 훅을 임포트하고 별칭 사용
import useInternalGeoJsonState from './geojson/useGeoJsonState';
import GeoJsonLoader from './geojson/GeoJsonLoader';
import { GeoJsonLayerProps, GeoNode, GeoLink } from './geojson/GeoJsonTypes';

const GeoJsonLayer: React.FC<GeoJsonLayerProps> = ({
  map,
  visible, // 이 `visible` prop은 MapContext의 showGeoJson 상태에 의해 제어됨
  isMapInitialized,
  isNaverLoaded,
  onGeoJsonLoaded // 상위 컴포넌트로 로드된 데이터를 전달하기 위한 콜백
}) => {
  const {
    isLoading, // useInternalGeoJsonState에서 제공
    error,     // useInternalGeoJsonState에서 제공
    isLoaded,  // useInternalGeoJsonState에서 제공
    nodes,     // useInternalGeoJsonState에서 제공 (로컬 로딩 결과)
    links,     // useInternalGeoJsonState에서 제공 (로컬 로딩 결과)
    handleLoadSuccess, // useInternalGeoJsonState의 로딩 성공 핸들러
    handleLoadError,   // useInternalGeoJsonState의 로딩 실패 핸들러
    clearDisplayedFeatures, // useInternalGeoJsonState에서 제공
  } = useInternalGeoJsonState(map); // map 객체를 인자로 전달

  useEffect(() => {
    // 내부적으로 GeoJSON 데이터 로드가 완료되면,
    // onGeoJsonLoaded 콜백(prop)을 호출하여 상위(MapContext)에 알림
    if (isLoaded && onGeoJsonLoaded) {
      onGeoJsonLoaded(nodes, links);
    }
  }, [isLoaded, nodes, links, onGeoJsonLoaded]);

  useEffect(() => {
    if (!isLoaded || !clearDisplayedFeatures) return;

    // MapContext에서 전달된 visible 상태에 따라 피처를 지움
    if (!visible) {
      console.log('[GeoJsonLayer] Layer is now hidden (controlled by parent). Clearing displayed GeoJSON features.');
      clearDisplayedFeatures();
    }
    // visible이 true일 때 자동으로 무언가를 표시할 필요는 없음.
    // 표시는 renderRoute 등을 통해 외부에서 트리거됨.
  }, [visible, isLoaded, clearDisplayedFeatures]);

  return (
    <>
      {/* 로컬 로딩 상태에 따라 GeoJsonLoader 표시 */}
      {(!isLoaded && !error) && (
        <GeoJsonLoader
          isMapInitialized={isMapInitialized}
          isNaverLoaded={isNaverLoaded}
          onLoadSuccess={(loadedNodes: GeoNode[], loadedLinks: GeoLink[]) => {
            // GeoJsonLoader가 성공하면 내부 상태 훅의 handleLoadSuccess 호출
            handleLoadSuccess(loadedNodes, loadedLinks);
            // `visible` prop (상위 컴포넌트에서 제어)이 true이고 로딩중이 아닐 때 토스트 표시
            // 이 시점의 isLoading은 GeoJsonLoader 호출 전의 isLoading 상태이므로,
            // 로드가 성공적으로 완료되었음을 알리는 것이 더 적절함.
            if (visible) { 
              toast.success('경로 데이터가 로드되었습니다.');
            }
          }}
          onLoadError={handleLoadError} // 내부 상태 훅의 handleLoadError 호출
        />
      )}
      
      {/* 로컬 로딩 중 상태 표시 */}
      {isLoading && (
        <div className="absolute bottom-16 left-4 bg-background/80 backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 중...
        </div>
      )}
      
      {/* 로컬 로딩 에러 상태 표시 */}
      {error && (
        <div className="absolute bottom-16 left-4 bg-red-500/80 text-white backdrop-blur-sm p-2 rounded-md text-sm">
          경로 데이터 로드 실패: {error.message}
        </div>
      )}
    </>
  );
};

export default GeoJsonLayer;
