
import React, { useState, useEffect } from 'react';

interface MapLoadingOverlayProps {
  isNaverLoaded: boolean;
  isMapError: boolean;
}

const MapLoadingOverlay: React.FC<MapLoadingOverlayProps> = ({ isNaverLoaded, isMapError }) => {
  const [showDetailedError, setShowDetailedError] = useState<boolean>(false);
  const [longWaiting, setLongWaiting] = useState<boolean>(false);

  // 장시간 로딩 감지
  useEffect(() => {
    if (!isNaverLoaded && !isMapError) {
      const timer = setTimeout(() => {
        setLongWaiting(true);
      }, 8000); // 8초 이상 로딩 중이면 추가 메시지 표시
      
      return () => clearTimeout(timer);
    }
    
    // 로딩이 완료되거나 에러가 발생했을 때 상태 초기화
    setLongWaiting(false);
  }, [isNaverLoaded, isMapError]);
  
  // 이미 로드된 경우 아무것도 표시하지 않음
  if (isNaverLoaded && !isMapError) {
    return null;
  }

  return (
    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
      {!isNaverLoaded && !isMapError && (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-medium mb-2">지도를 불러오는 중...</div>
          <p className="text-sm text-gray-600 mb-2">네이버 지도 API를 로드하고 있습니다.</p>
          
          {longWaiting && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
              <p className="text-sm text-yellow-700 mb-1">지도 로딩이 예상보다 오래 걸리고 있습니다.</p>
              <p className="text-xs text-yellow-600">인터넷 연결을 확인하거나, 잠시 후 페이지를 새로고침해 보세요.</p>
              <button 
                onClick={() => window.location.reload()}
                className="mt-2 px-3 py-1 bg-yellow-500 text-white text-xs rounded hover:bg-yellow-600 transition-colors"
              >
                페이지 새로고침
              </button>
            </div>
          )}
        </div>
      )}
      
      {isMapError && (
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-md">
          <div className="w-12 h-12 mx-auto mb-4 text-red-500">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="text-lg font-medium text-red-600 mb-2">지도 로딩 실패</div>
          <p className="text-sm text-gray-600 mb-4">지도를 불러오는 데 문제가 발생했습니다.</p>
          
          <div className="text-xs text-gray-500 mb-4">
            <button 
              onClick={() => setShowDetailedError(!showDetailedError)}
              className="text-blue-500 underline mb-2"
            >
              {showDetailedError ? '간단한 오류 정보 보기' : '상세 오류 정보 보기'}
            </button>
            
            {showDetailedError ? (
              <div className="mt-2 p-3 bg-gray-50 rounded text-left">
                <p className="font-medium mb-1">가능한 원인:</p>
                <ul className="list-disc list-inside">
                  <li>네이버 지도 API 키 설정 오류</li>
                  <li>네트워크 연결 문제</li>
                  <li>브라우저 호환성 문제</li>
                  <li>브라우저 쿠키/캐시 문제</li>
                  <li>CORS(Cross-Origin) 정책 제한</li>
                </ul>
                <p className="mt-2 font-medium">해결 방법:</p>
                <ul className="list-disc list-inside">
                  <li>페이지 새로고침</li>
                  <li>다른 브라우저로 시도</li>
                  <li>브라우저 캐시 및 쿠키 삭제</li>
                  <li>네트워크 연결 확인</li>
                </ul>
              </div>
            ) : (
              <ul className="mt-1 list-disc list-inside">
                <li>네트워크 연결 문제</li>
                <li>API 키 설정 오류</li>
                <li>브라우저 호환성 문제</li>
              </ul>
            )}
          </div>
          
          <div className="flex justify-center space-x-2">
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
            >
              새로고침
            </button>
            
            <button 
              onClick={() => {
                // 브라우저 캐시를 무시하고 강제 새로고침
                window.location.href = window.location.href + '?nocache=' + Date.now();
              }}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-md transition-colors"
            >
              캐시 삭제 후 새로고침
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapLoadingOverlay;
