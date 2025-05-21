import React from 'react';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
import ItineraryDisplayWrapper from './ItineraryDisplayWrapper';
import MainPanelWrapper from './MainPanelWrapper';
import type { Place, ItineraryDay, CategoryName } from '@/types'; // Assuming types are in @/types

// Props for ItineraryDisplayWrapper
interface ItineraryDisplayWrapperPassedProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
  onCloseItinerary: () => void;
  handleClosePanelWithBackButton: () => void;
  debug: {
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
    onCreateItinerary: () => void; // 반환 타입을 boolean에서 void로 변경
    itinerary: ItineraryDay[] | null;
    selectedItineraryDay: number | null;
    onSelectDay: (day: number) => void;
    isGenerating?: boolean;
  };
  leftPanelContentProps: {
    onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
    onOpenRegionPanel: () => void;
    hasSelectedDates: boolean;
    onCategoryClick: (category: string) => void;
    regionConfirmed: boolean;
    categoryStepIndex: number;
    activeMiddlePanelCategory: string | null;
    confirmedCategories: string[];
    selectedKeywordsByCategory: Record<string, string[]>;
    toggleKeyword: (category: string, keyword: string) => void;
    directInputValues: {
      accomodation: string;
      landmark: string;
      restaurant: string;
      cafe: string;
    };
    onDirectInputChange: {
      accomodation: (value: string) => void;
      landmark: (value: string) => void;
      restaurant: (value: string) => void;
      cafe: (value: string) => void;
    };
    onConfirmCategoryCallbacks: { // 이전에 onConfirmCategory 였던 것
      accomodation: (finalKeywords: string[]) => void;
      landmark: (finalKeywords: string[]) => void;
      restaurant: (finalKeywords: string[]) => void;
      cafe: (finalKeywords: string[]) => void;
    };
    handlePanelBackCallbacks: { // 이전에 handlePanelBack 이었던 것
      accomodation: () => void;
      landmark: () => void;
      restaurant: () => void;
      cafe: () => void;
    };
    isCategoryButtonEnabled: (category: string) => boolean;
    isGenerating?: boolean;
  };
}


interface LeftPanelDisplayLogicProps {
  isGenerating: boolean;
  shouldShowItineraryView: boolean;
  itineraryDisplayProps: ItineraryDisplayWrapperPassedProps | null; // Nullable if not showing itinerary
  mainPanelProps: MainPanelWrapperPassedProps | null; // Nullable if showing itinerary or loading
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

  return null; // Should not happen if logic is correct
};

export default LeftPanelDisplayLogic;
