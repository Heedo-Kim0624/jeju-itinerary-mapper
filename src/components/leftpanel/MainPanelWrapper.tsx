
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import type { Place, ItineraryDay } from '@/types'; 
import type { CategoryName } from '@/utils/categoryUtils';

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
  onCreateItinerary: () => void; 
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
  activeMiddlePanelCategory: CategoryName | null; // Fixed type to CategoryName
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
  onConfirmCategoryCallbacks: { 
    accomodation: (finalKeywords: string[]) => void;
    landmark: (finalKeywords: string[]) => void;
    restaurant: (finalKeywords: string[]) => void;
    cafe: (finalKeywords: string[]) => void;
  };
  handlePanelBackCallbacks: { 
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
  // Fixed the call signatures by creating properly typed handler objects
  const onDirectInputChangeHandlers = {
    accomodation: leftPanelContentProps.onDirectInputChange.accomodation,
    landmark: leftPanelContentProps.onDirectInputChange.landmark,
    restaurant: leftPanelContentProps.onDirectInputChange.restaurant,
    cafe: leftPanelContentProps.onDirectInputChange.cafe
  };

  return (
    <LeftPanelContainer
      {...leftPanelContainerProps}
      children={
        <LeftPanelContent
          {...leftPanelContentProps}
          onDirectInputChange={onDirectInputChangeHandlers}
          onConfirmCategory={leftPanelContentProps.onConfirmCategoryCallbacks}
          handlePanelBack={leftPanelContentProps.handlePanelBackCallbacks}
        />
      }
    />
  );
};

export default MainPanelWrapper;
