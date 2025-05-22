
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useCategoryHandlers } from './use-category-handlers';
import { useInputState } from './use-input-state';
import { useCategoryResults } from '@/hooks/use-category-results';
import { useCategoryResultHandlers } from './use-category-result-handlers';

import type { useLeftPanelState } from './use-left-panel-state';
import type { useRegionSelection } from '@/hooks/use-region-selection';
import type { useTripDetails } from '@/hooks/use-trip-details';
import type { useSelectedPlaces } from '@/hooks/use-selected-places';
import type { CategoryName } from '@/types/core';

type LeftPanelStateHook = ReturnType<typeof useLeftPanelState>;
type RegionSelectionHook = ReturnType<typeof useRegionSelection>;
type TripDetailsHook = ReturnType<typeof useTripDetails>;
type PlacesManagementHook = ReturnType<typeof useSelectedPlaces>;

interface UseLeftPanelCategoryLogicProps {
  leftPanelState: LeftPanelStateHook;
  regionSelection: RegionSelectionHook;
  tripDetailsHookResult: TripDetailsHook;
  placesManagement: PlacesManagementHook;
}

export const useLeftPanelCategoryLogic = ({
  leftPanelState,
  regionSelection,
  tripDetailsHookResult,
  placesManagement,
}: UseLeftPanelCategoryLogicProps) => {
  const categorySelectionHookResult = useCategorySelection();
  const categoryHandlersHook = useCategoryHandlers();
  const { directInputValues, onDirectInputChange } = useInputState();

  const {
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces,
    normalPlaces,
    refetch: refetchCategoryResults,
  } = useCategoryResults(
    leftPanelState.showCategoryResult,
    leftPanelState.showCategoryResult
      ? categorySelectionHookResult.selectedKeywordsByCategory[leftPanelState.showCategoryResult] || []
      : [],
    regionSelection.selectedRegions
  );

  const categoryResultHandlers = useCategoryResultHandlers(
    regionSelection.selectedRegions,
    tripDetailsHookResult,
    placesManagement.handleAutoCompletePlaces,
    leftPanelState.setShowCategoryResult // Pass the setter here
  );

  const handleCategorySelect = (category: string) => {
    // This now uses refetchCategoryResults from useCategoryResults
    categoryHandlersHook.handleCategorySelect(category, refetchCategoryResults);
    // Also, update the selected category in the left panel state
    leftPanelState.setSelectedCategory(category as CategoryName);
    leftPanelState.setShowCategoryResult(null); // Reset sub-category view potentially
  };
  
  const handleConfirmCategory = (category: string, finalKeywords: string[], clearSelection: boolean = false) => {
    categorySelectionHookResult.handleConfirmCategory(category as CategoryName, finalKeywords, clearSelection);
    // The original logic in use-left-panel set showCategoryResult *after* confirming,
    // to show the results for that category.
    // If clearSelection is true, it might mean we are selecting a new primary category.
    // Let's assume setShowCategoryResult is used to display the keyword selection panel for a category
    if (clearSelection) { // This condition was used in use-left-panel
        leftPanelState.setShowCategoryResult(category as CategoryName);
    }
  };


  const categoryKeywordsAndInputs = {
    directInputValues,
    onDirectInputChange,
    handleConfirmCategory, // Use the locally defined version
  };

  const categoryResultsData = {
    isLoading: isCategoryLoading,
    error: categoryError,
    recommendedPlaces: recommendedPlaces || [],
    normalPlaces: normalPlaces || [],
    refetchCategoryResults,
  };
  
  // Exposing setSelectedCategory from leftPanelState for category panel navigation (back button)
  const enhancedCategorySelection = {
    ...categorySelectionHookResult,
    setActiveMiddlePanelCategory: (category: CategoryName | null) => {
      leftPanelState.setSelectedCategory(category);
    },
    handlePanelBack: () => {
      leftPanelState.setSelectedCategory(null);
      // setShowCategoryResult(null) might also be needed depending on flow
    },
  };


  return {
    categorySelection: enhancedCategorySelection, // Includes navigation panel logic
    keywordsAndInputs: categoryKeywordsAndInputs,
    categoryResultsData,
    categoryResultHandlers,
    handleCategorySelect, // Main handler for selecting a primary category
    // selectedCategory and showCategoryResult are managed by leftPanelState, passed in.
  };
};
