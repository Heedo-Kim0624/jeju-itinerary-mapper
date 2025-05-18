
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary';
import { CategoryName } from '@/utils/categoryUtils'; // For onConfirmCategory type

// Props for LeftPanelContainer
interface LeftPanelContainerSharedProps {
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
  onCreateItinerary: () => boolean;
  itinerary: ItineraryDay[] | null; // This might be null here
  selectedItineraryDay: number | null; // This might be null here
  onSelectDay: (day: number) => void; // For container's internal use if any
}

// Props for LeftPanelContent
interface LeftPanelContentSharedProps {
  onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: string) => void; // From categorySelection.handleCategoryButtonClick
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: string | null;
  confirmedCategories: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  toggleKeyword: (category: string, keyword: string) => void;
  directInputValues: { accomodation: string; landmark: string; restaurant: string; cafe: string; };
  onDirectInputChange: {
    accomodation: (value: string) => void;
    landmark: (value: string) => void;
    restaurant: (value: string) => void;
    cafe: (value: string) => void;
  };
  onConfirmCategoryInContent: { // Renamed to avoid conflict with LeftPanel's own handleConfirmCategory
    accomodation: (finalKeywords: string[]) => boolean; // Assuming boolean return based on LeftPanel
    landmark: (finalKeywords: string[]) => boolean;
    restaurant: (finalKeywords: string[]) => boolean;
    cafe: (finalKeywords: string[]) => boolean;
  };
  handlePanelBack: {
    accomodation: () => void;
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
  isCategoryButtonEnabled: (category: string) => boolean;
}

interface LeftPanelCoreContentProps extends LeftPanelContainerSharedProps, LeftPanelContentSharedProps {
  showItinerary: boolean; // Prop for LeftPanelContainer
  onSetShowItinerary: (show: boolean) => void; // Prop for LeftPanelContainer
}

const LeftPanelCoreContent: React.FC<LeftPanelCoreContentProps> = (props) => {
  const {
    // Container props
    showItinerary,
    onSetShowItinerary,
    selectedPlaces,
    onRemovePlace,
    onViewOnMap,
    allCategoriesSelected,
    dates,
    onCreateItinerary,
    itinerary,
    selectedItineraryDay,
    onSelectDay,
    // Content props
    onDateSelect,
    onOpenRegionPanel,
    hasSelectedDates,
    onCategoryClick,
    regionConfirmed,
    categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    toggleKeyword,
    directInputValues,
    onDirectInputChange,
    onConfirmCategoryInContent,
    handlePanelBack,
    isCategoryButtonEnabled,
  } = props;

  return (
    <LeftPanelContainer
      showItinerary={showItinerary} // Will be false when this component is rendered by LeftPanel
      onSetShowItinerary={onSetShowItinerary}
      selectedPlaces={selectedPlaces}
      onRemovePlace={onRemovePlace}
      onViewOnMap={onViewOnMap}
      allCategoriesSelected={allCategoriesSelected}
      dates={dates}
      onCreateItinerary={onCreateItinerary}
      itinerary={itinerary}
      selectedItineraryDay={selectedItineraryDay}
      onSelectDay={onSelectDay}
    >
      <LeftPanelContent
        onDateSelect={onDateSelect}
        onOpenRegionPanel={onOpenRegionPanel}
        hasSelectedDates={hasSelectedDates}
        onCategoryClick={onCategoryClick}
        regionConfirmed={regionConfirmed}
        categoryStepIndex={categoryStepIndex}
        activeMiddlePanelCategory={activeMiddlePanelCategory}
        confirmedCategories={confirmedCategories}
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        toggleKeyword={toggleKeyword}
        directInputValues={directInputValues}
        onDirectInputChange={onDirectInputChange}
        onConfirmCategory={onConfirmCategoryInContent} // Pass renamed prop
        handlePanelBack={handlePanelBack}
        isCategoryButtonEnabled={isCategoryButtonEnabled}
      />
    </LeftPanelContainer>
  );
};

export default LeftPanelCoreContent;
