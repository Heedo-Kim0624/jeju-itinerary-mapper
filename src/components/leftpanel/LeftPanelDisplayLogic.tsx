
import React from 'react';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import MainPanelWrapper from './MainPanelWrapper';
// Removed local Place, ItineraryDay, CategoryName imports as they are handled in types.ts or indirectly via imported types
import type { ItineraryDisplayWrapperPassedProps, MainPanelWrapperProps } from './types'; // Import centralized types


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

  if (shouldShowItineraryView && itineraryDisplayProps) {
    return <ItineraryDisplayWrapper {...itineraryDisplayProps} />;
  }

  if (mainPanelProps) {
    return <MainPanelWrapper {...mainPanelProps} />;
  }

  return null;
};

export default LeftPanelDisplayLogic;
