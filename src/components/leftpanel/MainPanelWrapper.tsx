
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import type { Place, ItineraryDay, CategoryName } from '@/types'; 

// Props for LeftPanelContainer
interface LeftPanelContainerPassedProps {
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
  onCreateItinerary: () => void; // boolean 대신 void로 변경
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
  isGenerating?: boolean;
}

// Props for LeftPanelContent
interface LeftPanelContentPassedProps {
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
  onConfirmCategoryCallbacks: { // Renamed to avoid conflict and clarify these are callbacks
    accomodation: (finalKeywords: string[]) => void;
    landmark: (finalKeywords: string[]) => void;
    restaurant: (finalKeywords: string[]) => void;
    cafe: (finalKeywords: string[]) => void;
  };
  handlePanelBackCallbacks: { // Renamed for clarity
    accomodation: () => void;
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
  isCategoryButtonEnabled: (category: string) => boolean;
  isGenerating?: boolean;
}

interface MainPanelWrapperProps {
  leftPanelContainerProps: LeftPanelContainerPassedProps;
  leftPanelContentProps: LeftPanelContentPassedProps;
}

const MainPanelWrapper: React.FC<MainPanelWrapperProps> = ({
  leftPanelContainerProps,
  leftPanelContentProps,
}) => {
  return (
    <LeftPanelContainer
      {...leftPanelContainerProps}
      children={
        <LeftPanelContent
          {...leftPanelContentProps}
          onConfirmCategory={leftPanelContentProps.onConfirmCategoryCallbacks} // Pass renamed prop
          handlePanelBack={leftPanelContentProps.handlePanelBackCallbacks} // Pass renamed prop
        />
      }
    />
  );
};

export default MainPanelWrapper;
