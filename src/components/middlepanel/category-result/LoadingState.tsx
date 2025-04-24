
import React from 'react';

const LoadingState = () => {
  return (
    <div className="p-4 flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-jeju-green mb-4"></div>
      <p className="text-sm text-muted-foreground">장소 정보를 불러오는 중...</p>
      <p className="text-xs text-muted-foreground mt-2">키워드와 장소를 분석하는 데 잠시 시간이 걸릴 수 있습니다</p>
      <p className="text-xs text-muted-foreground mt-1">Supabase에서 데이터를 검색 중입니다</p>
    </div>
  );
};

export default LoadingState;
