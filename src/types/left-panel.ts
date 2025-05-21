
import type { Place, ItineraryDay } from '@/types';
import type { CategoryName } from '@/utils/categoryUtils';

export interface LeftPanelPropsData {
  // Navigation and panel states
  uiVisibility: {
    showItinerary: boolean;
    setShowItinerary: (show: boolean) => void;
    showCategoryResult: CategoryName | null;
    setShowCategoryResult: (category: CategoryName | null) => void;
  };
  currentPanel: 'region' | 'date' | 'category' | 'itinerary';
  isGeneratingItinerary: boolean;
  itineraryReceived: boolean;
  
  // Itinerary data
  itineraryManagement: {
    itinerary: ItineraryDay[] | null;
    selectedItineraryDay: number | null;
    handleSelectItineraryDay: (day: number) => void;
    isItineraryCreated?: boolean; // Already optional
    showItinerary: boolean; // Added from useLeftPanel's itineraryManagement
    setShowItinerary: (show: boolean) => void; // Added from useLeftPanel's itineraryManagement
  };
  
  // Trip details
  tripDetails: {
    dates?: {
      startDate: Date | null;
      endDate: Date | null;
      startTime: string;
      endTime: string;
    };
    setDates: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string }) => void;
  };
  
  // Place management
  placesManagement: {
    selectedPlaces: Place[];
    handleRemovePlace: (id: string) => void;
    handleViewOnMap: (place: Place) => void;
    handleSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
    allCategoriesSelected: boolean;
    allFetchedPlaces?: Place[];
  };
  
  // Category and region selection
  categorySelection: {
    handleCategoryButtonClick: (category: string) => void;
    stepIndex: number;
    activeMiddlePanelCategory: string | null;
    confirmedCategories: string[];
    selectedKeywordsByCategory: Record<string, string[]>;
    toggleKeyword: (category: string, keyword: string) => void;
    isCategoryButtonEnabled: (category: string) => boolean;
    handlePanelBack: () => void; 
  };
  
  regionSelection?: { // Made optional as it is in useLeftPanelProps
    selectedRegions: string[];
    regionConfirmed: boolean;
    setRegionConfirmed: (confirmed: boolean) => void;
    regionSlidePanelOpen: boolean;
    setRegionSlidePanelOpen: (open: boolean) => void;
    handleRegionToggle: (region: string) => void;
  };
  
  // Input state
  keywordsAndInputs: {
    directInputValues: Record<string, string>;
    onDirectInputChange: (category: string, value: string) => void;
    handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void;
  };
  
  // Category result handling
  categoryResultHandlers: {
    handleResultClose: () => void;
    handleConfirmCategoryWithAutoComplete: (category: string, selectedPlaces: Place[], recommendedPlaces: Place[]) => void;
  };
  
  // Itinerary creation/closing
  handleCloseItinerary: () => void;
  handleCreateItinerary?: () => Promise<any | null>; // Changed from Promise<void> to Promise<any | null> to match useCreateItineraryHandler

  // Structured Callbacks
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
}
