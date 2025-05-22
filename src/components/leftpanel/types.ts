
import type { Place, ItineraryDay } from '@/types';
import type { CategoryName } from '@/utils/categoryUtils';

// Props for LeftPanelContainer, formerly in MainPanelWrapper.tsx
export interface LeftPanelContainerPassedProps {
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

// Props for LeftPanelContent, formerly in MainPanelWrapper.tsx
export interface LeftPanelContentPassedProps {
  onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: string) => void;
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: CategoryName | null;
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

// Props for MainPanelWrapper, formerly in MainPanelWrapper.tsx and LeftPanelDisplayLogic.tsx
export interface MainPanelWrapperProps {
  leftPanelContainerProps: LeftPanelContainerPassedProps;
  leftPanelContentProps: LeftPanelContentPassedProps;
}

// Props for ItineraryDisplayWrapper, formerly in LeftPanelDisplayLogic.tsx
export interface ItineraryDisplayWrapperPassedProps {
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

