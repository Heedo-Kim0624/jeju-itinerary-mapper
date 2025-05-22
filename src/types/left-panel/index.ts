
import type { ItineraryDay, Place, CategoryName, SchedulePayload } from '@/types/core';
import type { NewServerScheduleResponse } from '@/types/schedule'; // Ensure this path is correct

// Itinerary Management
export interface ItineraryManagementState {
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  isItineraryCreated: boolean;
  showItinerary: boolean;
  handleSelectItineraryDay: (day: number) => void;
  setShowItinerary: (show: boolean) => void;
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
  handleServerItineraryResponse?: (
    parsedItinerary: ItineraryDay[] // Simplified: only takes parsed itinerary
  ) => void; // Returns void as it primarily sets state
}

// Trip Details
export interface TripDetailsState {
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  tripDuration: number;
  handleDateChange: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string } | null) => void;
  isDateSet: boolean;
}

// Places Management
export interface PlacesManagementState {
  selectedPlaces: Place[];
  candidatePlaces: Place[];
  allCategoriesSelected: boolean;
  handleSelectPlace: (place: Place, categoryName: CategoryName) => void; // Assuming categoryName is string or CategoryName
  handleRemovePlace: (id: string) => void;
  handleViewOnMap: (place: Place) => void;
  prepareSchedulePayload: (
    startDatetimeISO: string | null,
    endDatetimeISO: string | null
  ) => SchedulePayload | null;
  handleAutoCompletePlaces: (
    category: CategoryName,
    placesFromApi: Place[],
    keywords: string[]
  ) => void;
  setCandidatePlaces: (places: Place[]) => void;
  setSelectedPlaces: (places: Place[]) => void;
}

// Category Selection
export interface CategorySelectionState {
  categoryOrder: CategoryName[];
  activeMiddlePanelCategory: CategoryName | null;
  confirmedCategories: CategoryName[];
  selectedKeywordsByCategory: Record<CategoryName, string[]>;
  categoryStepIndex: number;
  handleCategoryClick: (category: CategoryName) => void;
  handleConfirmCategory: (category: CategoryName, keywords: string[], clearSelection?: boolean) => void;
  handlePanelBack: (category: CategoryName) => void;
  toggleKeyword: (category: CategoryName, keyword: string) => void;
  isCategoryButtonEnabled: (category: CategoryName) => boolean;
  resetCategorySelection: () => void;
  // Added setActiveMiddlePanelCategory if it's managed here
  setActiveMiddlePanelCategory: (category: CategoryName | null) => void; 
}

// Region Selection
export interface RegionSelectionState {
  regionSlidePanelOpen: boolean;
  setRegionSlidePanelOpen: (open: boolean) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[] | ((prev: string[]) => string[])) => void;
  handleRegionToggle: (region: string) => void;
  regionConfirmed: boolean;
  setRegionConfirmed: (confirmed: boolean) => void;
}

// Keywords and Inputs
export interface KeywordsAndInputsState {
  directInputValues: Record<CategoryName, string>;
  onDirectInputChange: (category: CategoryName, value: string) => void;
  // handleConfirmCategory is often part of CategorySelectionState or a general callback collection
}

// Category Result Handlers
export interface CategoryResultHandlersState {
  handleResultClose: (category: CategoryName) => void; // Takes category to know which to close
  handleConfirmCategoryWithAutoComplete: (category: CategoryName, keywords: string[]) => Promise<void>;
}

// UI Visibility
export interface UiVisibilityState {
  showItinerary: boolean;
  setShowItinerary: (show: boolean) => void;
  showCategoryResult: CategoryName | null;
  setShowCategoryResult: (category: CategoryName | null) => void;
}

// Props for ItineraryDisplayWrapper
export interface ItineraryDisplayWrapperPassedProps {
  itinerary: ItineraryDay[];
  startDate: Date;
  onSelectDay: (day: number) => void;
  selectedDay: number | null;
  onCloseItinerary: () => void;
  handleClosePanelWithBackButton: () => void;
  debug?: { // Made optional
    itineraryLength: number;
    selectedDay: number | null;
    showItinerary: boolean;
  };
}

// Props for LeftPanelContainer
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

// Props for LeftPanelContent
export interface LeftPanelContentPassedProps {
  onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: CategoryName) => void;
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: CategoryName | null;
  confirmedCategories: CategoryName[];
  selectedKeywordsByCategory: Record<CategoryName, string[]>;
  toggleKeyword: (category: CategoryName, keyword: string) => void;
  directInputValues: Record<CategoryName, string>; // Changed to Record<CategoryName, string>
  onDirectInputChange: Record<CategoryName, (value: string) => void>; // Changed
  onConfirmCategoryCallbacks: Record<CategoryName, (finalKeywords: string[]) => void>;
  handlePanelBackCallbacks: Record<CategoryName, () => void>;
  isCategoryButtonEnabled: (category: CategoryName) => boolean;
  isGenerating?: boolean;
}

// Props for MainPanelWrapper
export interface MainPanelWrapperPassedProps {
  leftPanelContainerProps: LeftPanelContainerPassedProps;
  leftPanelContentProps: LeftPanelContentPassedProps;
}


// Overall orchestrator props for sub-components (used in useLeftPanelProps)
export interface LeftPanelPropsData {
  uiVisibility: UiVisibilityState;
  currentPanel: string; // Consider making this a more specific type e.g. 'region' | 'date' | ...
  isGeneratingItinerary: boolean;
  itineraryReceived: boolean;
  itineraryManagement: ItineraryManagementState;
  tripDetails: TripDetailsState;
  placesManagement: PlacesManagementState;
  categorySelection: CategorySelectionState;
  keywordsAndInputs: KeywordsAndInputsState; // This is where directInputValues comes from
  categoryResultHandlers: CategoryResultHandlersState;
  handleCloseItinerary: () => void;
  regionSelection: RegionSelectionState;
  onConfirmCategoryCallbacks: Record<CategoryName, (keywords: string[]) => void>;
  handlePanelBackCallbacks: Record<CategoryName, () => void>;
}


// Props for DevDebugInfo
export interface DevDebugInfoProps {
  showItinerary: boolean;
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  isGenerating: boolean;
  itineraryReceived: boolean;
  startDate: Date | null;
  endDate: Date | null;
}

// Props for CategoryResultHandler component
export interface CategoryResultHandlerProps {
  showCategoryResult: CategoryName | null;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<CategoryName, string[]>; // Use CategoryName as key
  onClose: (category: CategoryName) => void; // onClose specific to the category
  onSelectPlace: (place: Place, categoryName: CategoryName) => void; // Ensure categoryName is passed
  selectedPlaces: Place[];
  onConfirmCategory?: (category: CategoryName, selectedPlacesFromPanel: Place[], recommendedPlacesFromPanel: Place[]) => void;
}
