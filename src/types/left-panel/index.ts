import type { ItineraryDay, Place, CategoryName } from '@/types/core';
import type { NewServerScheduleResponse } from '@/types/schedule';

export interface ItineraryManagementState {
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  isItineraryCreated: boolean;
  showItinerary: boolean;
  handleSelectItineraryDay: (day: number) => void;
  setShowItinerary: (show: boolean) => void;
  setItinerary: (itinerary: ItineraryDay[] | null) => void; // Added
  // Optional: if generateItinerary is part of this state directly
  // generateItinerary: (
  //   placesToUse: Place[], 
  //   startDate: Date, 
  //   endDate: Date, 
  //   startTime: string, 
  //   endTime: string
  // ) => Promise<ItineraryDay[] | null> | ItineraryDay[] | null; 
  handleServerItineraryResponse?: (
    response: NewServerScheduleResponse, 
    tripStartDate: Date, 
    originalSelectedPlaces: Place[]
  ) => void;
}

// ... (rest of the file, e.g., LeftPanelPropsData)

export interface TripDetailsState {
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  startDatetime: string | null;
  endDatetime: string | null;
  tripDuration: number; // days
  handleDateChange: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string } | null) => void;
  isDateSet: boolean;
}

export interface PlacesManagementState {
  selectedPlaces: Place[];
  candidatePlaces: Place[]; // 자동완성 또는 추천으로 추가된 장소들
  allCategoriesSelected: boolean;
  // ... other place related states and functions
  handleSelectPlace: (place: Place, categoryName: CategoryName) => void;
  handleRemovePlace: (id: string) => void;
  handleViewOnMap: (place: Place) => void;
  prepareSchedulePayload: (
    startDatetimeISO: string | null,
    endDatetimeISO: string | null
  ) => import('@/types/core').SchedulePayload | null;
  handleAutoCompletePlaces: (
    category: CategoryName,
    placesFromApi: Place[],
    keywords: string[]
  ) => void;
  setCandidatePlaces: (places: Place[]) => void;
  setSelectedPlaces: (places: Place[]) => void;
}


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
}


export interface RegionSelectionState {
  regionSlidePanelOpen: boolean;
  setRegionSlidePanelOpen: (open: boolean) => void;
  selectedRegions: string[];
  setSelectedRegions: (regions: string[] | ((prev: string[]) => string[])) => void;
  handleRegionToggle: (region: string) => void;
  regionConfirmed: boolean;
  setRegionConfirmed: (confirmed: boolean) => void;
}


export interface KeywordsAndInputsState {
  directInputValues: Record<CategoryName, string>;
  onDirectInputChange: (category: CategoryName, value: string) => void;
  handleConfirmCategory: (category: CategoryName, finalKeywords: string[], clearSelection?: boolean) => void;
}

export interface CategoryResultHandlersState {
  handleResultClose: (category: CategoryName) => void;
  handleConfirmCategoryWithAutoComplete: (category: CategoryName, keywords: string[]) => Promise<void>;
}

export interface LeftPanelPropsData {
  uiVisibility: {
    showItinerary: boolean;
    setShowItinerary: (show: boolean) => void;
    showCategoryResult: CategoryName | null;
    setShowCategoryResult: (category: CategoryName | null) => void;
  };
  currentPanel: string;
  isGeneratingItinerary: boolean;
  itineraryReceived: boolean; // 서버로부터 응답을 받았는지 여부
  itineraryManagement: ItineraryManagementState;
  tripDetails: TripDetailsState;
  placesManagement: PlacesManagementState;
  categorySelection: CategorySelectionState;
  keywordsAndInputs: KeywordsAndInputsState;
  categoryResultHandlers: CategoryResultHandlersState;
  handleCloseItinerary: () => void;
  regionSelection: RegionSelectionState;
  // Callbacks for confirming categories and going back, passed down from orchestrator
  onConfirmCategoryCallbacks: Record<CategoryName, (keywords: string[]) => void>;
  handlePanelBackCallbacks: Record<CategoryName, () => void>;
}
