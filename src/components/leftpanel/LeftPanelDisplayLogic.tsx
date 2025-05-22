
import React from 'react';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import MainPanelWrapper from './MainPanelWrapper';
// Import the specific prop types from the consolidated types file
import type { 
  ItineraryDisplayWrapperPassedProps,
  MainPanelWrapperPassedProps 
} from '@/types/left-panel/index';

interface LeftPanelDisplayLogicProps {
  isGenerating: boolean;
  shouldShowItineraryView: boolean;
  itineraryDisplayProps: ItineraryDisplayWrapperPassedProps | null; // Use the imported type
  mainPanelProps: MainPanelWrapperPassedProps | null; // Use the imported type
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
    // itineraryDisplayProps should already be correctly typed as ItineraryDisplayWrapperPassedProps | null
    // And ItineraryDisplayWrapperPassedProps has `debug` as optional.
    return <ItineraryDisplayWrapper {...itineraryDisplayProps} />;
  }

  if (mainPanelProps) {
    // mainPanelProps should be MainPanelWrapperPassedProps | null
    // And MainPanelWrapperPassedProps has directInputValues as Record<CategoryName, string>
    return <MainPanelWrapper {...mainPanelProps} />;
  }
  
  console.log("LeftPanelDisplayLogic: No panel to display (isGenerating: false, shouldShowItineraryView: false, mainPanelProps or itineraryDisplayProps missing/invalid)");
  return null; 
};

export default LeftPanelDisplayLogic;
