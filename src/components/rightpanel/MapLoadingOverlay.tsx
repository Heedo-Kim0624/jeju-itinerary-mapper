
import React from 'react';

interface MapLoadingOverlayProps {
  isNaverLoaded: boolean;
  isMapError: boolean;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({ isNaverLoaded, isMapError }) => {
  if (isNaverLoaded && !isMapError) {
    return null;
  }

  return (
    <>
      {!isNaverLoaded && !isMapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">지도를 불러오는 중...</div>
            <div className="loader"></div>
          </div>
        </div>
      )}
      {isMapError && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-100">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">지도 로딩 실패</div>
            <p>지도를 불러오는 데 문제가 발생했습니다. 다시 시도해주세요.</p>
          </div>
        </div>
      )}
    </>
  );
};

export default MapLoadingOverlay;
