
import { useMemo } from 'react';
import type { CategoryName } from '@/utils/categoryUtils';
import type { LeftPanelPropsData } from '@/types/left-panel'; // 경로 수정

type UseLeftPanelContentPropsArgs = Pick<
  LeftPanelPropsData,
  | 'tripDetails'
  | 'regionSelection'
  | 'categorySelection'
  | 'keywordsAndInputs'
  | 'isGeneratingItinerary'
  | 'uiVisibility'
  | 'onConfirmCategoryCallbacks'
  | 'handlePanelBackCallbacks'
>;

export const useLeftPanelContentProps = ({
  tripDetails,
  regionSelection,
  categorySelection,
  keywordsAndInputs,
  isGeneratingItinerary,
  uiVisibility,
  onConfirmCategoryCallbacks,
  handlePanelBackCallbacks,
}: UseLeftPanelContentPropsArgs) => {
  return useMemo(() => {
    if (isGeneratingItinerary || uiVisibility.showItinerary || !regionSelection) {
      return null;
    }
    return {
      onDateSelect: tripDetails.setDates,
      onOpenRegionPanel: () => regionSelection.setRegionSlidePanelOpen(true),
      hasSelectedDates: !!tripDetails.dates?.startDate && !!tripDetails.dates?.endDate,
      onCategoryClick: categorySelection.handleCategoryButtonClick,
      regionConfirmed: regionSelection.regionConfirmed,
      categoryStepIndex: categorySelection.stepIndex,
      activeMiddlePanelCategory: categorySelection.activeMiddlePanelCategory,
      confirmedCategories: categorySelection.confirmedCategories,
      selectedKeywordsByCategory: categorySelection.selectedKeywordsByCategory,
      toggleKeyword: categorySelection.toggleKeyword,
      directInputValues: {
        accomodation: keywordsAndInputs.directInputValues['숙소'] || '',
        landmark: keywordsAndInputs.directInputValues['관광지'] || '',
        restaurant: keywordsAndInputs.directInputValues['음식점'] || '',
        cafe: keywordsAndInputs.directInputValues['카페'] || '',
      },
      onDirectInputChange: {
        accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
        landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
        restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
        cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value),
      },
      isCategoryButtonEnabled: categorySelection.isCategoryButtonEnabled,
      isGenerating: isGeneratingItinerary,
      onConfirmCategoryCallbacks: onConfirmCategoryCallbacks,
      handlePanelBackCallbacks: handlePanelBackCallbacks,
    };
  }, [
    categorySelection,
    tripDetails,
    regionSelection,
    keywordsAndInputs,
    isGeneratingItinerary,
    uiVisibility.showItinerary,
    onConfirmCategoryCallbacks,
    handlePanelBackCallbacks,
  ]);
};
