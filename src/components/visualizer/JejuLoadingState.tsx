
import React from 'react';

interface JejuLoadingStateProps {
  isMapError: boolean;
  className?: string;
}

const JejuLoadingState: React.FC<JejuLoadingStateProps> = ({ isMapError, className }) => {
  return (
    <div className={`w-full h-full flex flex-col items-center justify-center bg-gray-100 rounded-lg p-6 ${className}`}>
      <h3 className="text-xl font-medium mb-4">
        {isMapError ? "지도 로드 오류" : "제주도 지도를 불러오는 중..."}
      </h3>
      
      <div className="flex items-center justify-center mb-4">
        {isMapError ? (
          <div className="h-8 w-8 text-red-500 animate-pulse">⚠️</div>
        ) : (
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        )}
      </div>
      
      <p className="text-sm text-gray-600 mb-4 text-center max-w-md">
        {isMapError 
          ? "네이버 지도 로드 중 오류가 발생했습니다. 페이지를 새로고침하거나 잠시 후 다시 시도해주세요." 
          : "네이버 지도 API를 불러오는 중입니다. 잠시만 기다려주세요."
        }
      </p>
    </div>
  );
};

export default JejuLoadingState;
