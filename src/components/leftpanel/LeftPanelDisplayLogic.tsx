
import React from 'react';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import MainPanelWrapper from './MainPanelWrapper';
import type { Place, ItineraryDay, CategoryName } from '@/types'; 

// Props for ItineraryDisplayWrapper
interface ItineraryDisplayWrapperPassedProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
  onCloseItinerary: () => void;
  handleClosePanelWithBackButton: () => void;
  debug?: { // Optional debug prop
    itineraryLength: number;
    selectedDay: number | null;
    showItinerary: boolean;
  };
}

// Props for MainPanelWrapper
interface MainPanelWrapperPassedProps {
  leftPanelContainerProps: {
    showItinerary: boolean;
    onSetShowItinerary: (show: boolean) => void;
    selectedPlaces: Place[];
    onRemovePlace: (id: string) => void;
    onViewOnMap: (place: Place) => void;
    allCategoriesSelected: boolean;
    dates: {
      startDate: Date | null;
      endDate: Date | null;
      startTime: string;
      endTime: string;
    } | null;
    onCreateItinerary: () => void; 
    itinerary: ItineraryDay[] | null;
    selectedItineraryDay: number | null;
    onSelectDay: (day: number) => void;
    isGenerating?: boolean;
  };
  leftPanelContentProps: {
    onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
    onOpenRegionPanel: () => void;
    hasSelectedDates: boolean;
    onCategoryClick: (category: CategoryName) => void; // Use CategoryName
    regionConfirmed: boolean;
    categoryStepIndex: number;
    activeMiddlePanelCategory: CategoryName | null; // Use CategoryName
    confirmedCategories: CategoryName[]; // Use CategoryName
    selectedKeywordsByCategory: Record<CategoryName, string[]>; // Use CategoryName
    toggleKeyword: (category: CategoryName, keyword: string) => void; // Use CategoryName
    directInputValues: Record<CategoryName, string>; // Use CategoryName
    onDirectInputChange: Record<CategoryName, (value: string) => void>; // Use CategoryName
    onConfirmCategoryCallbacks: Record<CategoryName, (finalKeywords: string[]) => void>; // Use CategoryName
    handlePanelBackCallbacks: Record<CategoryName, () => void>; // Use CategoryName
    isCategoryButtonEnabled: (category: CategoryName) => boolean; // Use CategoryName
    isGenerating?: boolean;
  };
}


interface LeftPanelDisplayLogicProps {
  isGenerating: boolean;
  shouldShowItineraryView: boolean;
  itineraryDisplayProps: ItineraryDisplayWrapperPassedProps | null;
  mainPanelProps: MainPanelWrapperPassedProps | null;
  // currentPanel prop is removed as it's not directly used for display logic here
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

  // Render MainPanelWrapper if not generating and not showing itinerary, and mainPanelProps exist
  if (mainPanelProps) {
    return <MainPanelWrapper {...mainPanelProps} />;
  }
  
  // Fallback or initial state before mainPanelProps are ready (e.g. loading config)
  // Could show a generic loading or be null if parent handles initial loading state
  console.log("LeftPanelDisplayLogic: No panel to display (isGenerating: false, shouldShowItineraryView: false, mainPanelProps missing)");
  return null; 
};

export default LeftPanelDisplayLogic;

