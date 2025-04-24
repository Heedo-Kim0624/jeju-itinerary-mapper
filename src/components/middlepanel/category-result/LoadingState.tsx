
import React from 'react';

const LoadingState = () => {
  return (
    <div className="p-4">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeju-green mb-4"></div>
      <p className="text-sm text-muted-foreground">장소 정보를 불러오는 중...</p>
    </div>
  );
};

export default LoadingState;
