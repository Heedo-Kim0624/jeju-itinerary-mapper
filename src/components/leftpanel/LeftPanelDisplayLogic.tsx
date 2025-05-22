
import React from 'react';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import MainPanelWrapper from './MainPanelWrapper';
import type { ItineraryDisplayWrapperPassedProps, MainPanelWrapperProps } from './types'; 

interface LeftPanelDisplayLogicProps {
  isGenerating: boolean;
  shouldShowItineraryView: boolean;
  itineraryDisplayProps: ItineraryDisplayWrapperPassedProps | null;
  mainPanelProps: MainPanelWrapperProps | null;
}

const LeftPanelDisplayLogic: React.FC<LeftPanelDisplayLogicProps> = ({
  isGenerating,
  shouldShowItineraryView,
  itineraryDisplayProps,
  mainPanelProps,
}) => {
  // 로딩 중인 경우, 로딩 인디케이터를 표시하지만 기존 UI 위에 오버레이로 표시
  const loadingOverlay = isGenerating && (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white/80 z-[70] flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <ScheduleLoadingIndicator
          text="일정을 생성하는 중..."
          subtext="잠시만 기다려주세요"
        />
      </div>
    </div>
  );

  // 일정 보기가 활성화된 경우
  if (shouldShowItineraryView && itineraryDisplayProps) {
    return (
      <>
        <ItineraryDisplayWrapper {...itineraryDisplayProps} />
        {loadingOverlay}
      </>
    );
  }

  // 메인 패널이 있는 경우
  if (mainPanelProps) {
    return (
      <>
        <MainPanelWrapper {...mainPanelProps} />
        {loadingOverlay}
      </>
    );
  }

  // 둘 다 없는 경우 (fallback)
  if (isGenerating) {
    return (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-[60] shadow-lg">
        <ScheduleLoadingIndicator
          text="일정을 생성하는 중..."
          subtext="잠시만 기다려주세요"
        />
      </div>
    );
  }

  return null;
};

export default LeftPanelDisplayLogic;
