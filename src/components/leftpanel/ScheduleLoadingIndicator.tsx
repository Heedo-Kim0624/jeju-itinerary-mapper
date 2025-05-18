
import React, { useEffect } from 'react';

interface ScheduleLoadingIndicatorProps {
  text?: string;
  subtext?: string;
}

export const ScheduleLoadingIndicator: React.FC<ScheduleLoadingIndicatorProps> = ({
  text = "일정을 생성하는 중...",
  subtext = "잠시만 기다려주세요"
}) => {
  // 컴포넌트 마운트/언마운트 시 로깅 추가
  useEffect(() => {
    console.log("[ScheduleLoadingIndicator] 로딩 인디케이터 표시됨");
    
    return () => {
      console.log("[ScheduleLoadingIndicator] 로딩 인디케이터 제거됨");
    };
  }, []);

  return (
    <div className="h-full flex flex-col items-center justify-center">
      <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
      <p className="text-lg font-medium">{text}</p>
      <p className="text-sm text-muted-foreground mt-2">{subtext}</p>
    </div>
  );
};
