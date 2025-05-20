
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary, // This is handleInitiateItineraryCreation from useLeftPanel
    handleCloseItinerary, // This is handleCloseItineraryPanel from useLeftPanel
    isGeneratingItinerary, // Use this from the hook
    itineraryReceived, // Use this from the hook
    categoryResultHandlers, // Contains handleResultClose, handleConfirmCategoryWithAutoComplete
  } = useLeftPanel();

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지 (Hook states):", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay,
      일정길이: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      로딩상태: isGeneratingItinerary,
      일정수신완료: itineraryReceived
    });
    
    if (!isGeneratingItinerary && itineraryReceived) {
      console.log("LeftPanel - 로딩 완료 및 일정 수신 완료 (Hook states)");
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGeneratingItinerary,
    itineraryReceived,
  ]);
  
  // Event listeners are handled by useEventListeners in useLeftPanel, so removed from here.

  const handleClosePanelWithBackButton = () => {
    console.log("[LeftPanel] '뒤로' 버튼으로 패널 닫기 실행");
    handleCloseItinerary(); 
  };

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  // handleResultClose is now taken from categoryResultHandlers.handleResultClose
  // handleConfirmCategoryWithAutoComplete is now taken from categoryResultHandlers.handleConfirmCategoryWithAutoComplete
  
  const handleConfirmCategoryKeywordSelection = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`[LeftPanel] 카테고리 '${category}' 키워드 확인: ${finalKeywords.join(', ')}`);
    // The true flag in handleConfirmCategory ensures setShowCategoryResult is called
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true);
    return true; // Assuming this is for compatibility if used in an event handler expecting a boolean
  };
  
  const handleCreateItineraryWithLoading = () => {
    console.log("[LeftPanel] 일정 생성 시작 (Hook call), isGeneratingItinerary state from hook:", isGeneratingItinerary);
    
    handleCreateItinerary() // This is handleInitiateItineraryCreation from useLeftPanel
      .then(success => {
        if (success) {
          console.log("[LeftPanel] handleCreateItinerary (hook) Promise 성공. 이벤트 및 hook state 변경 대기 중...");
          // Timeout logic removed, relying on hook's state management
        } else {
          console.log("[LeftPanel] handleCreateItinerary (hook) Promise 실패.");
          // Toasting for failure can be here or centralized in the hook.
          // useItineraryCreation already has some error toasts.
          // toast.error("일정 생성 요청에 실패했습니다."); // Potentially redundant
        }
      })
      .catch(error => {
        console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error);
        // toast.error("일정 생성 중 내부 오류가 발생했습니다."); // Potentially redundant
      });

    return true; // Assuming this is for compatibility if a button's onClick expects a boolean.
                 // Or if the original intent was to signal initiation.
  };
  
  const shouldShowItineraryView = uiVisibility.showItinerary;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직 (Hook states):", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isGeneratingPanelState: isGeneratingItinerary,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
  }, [uiVisibility.showItinerary, isGeneratingItinerary, itineraryManagement.itinerary, shouldShowItineraryView]);

  const itineraryDisplayProps = shouldShowItineraryView ? {
    itinerary: itineraryManagement.itinerary || [],
    startDate: tripDetails.dates?.startDate || new Date(),
    onSelectDay: itineraryManagement.handleSelectItineraryDay,
    selectedDay: itineraryManagement.selectedItineraryDay,
    onCloseItinerary: handleCloseItinerary,
    handleClosePanelWithBackButton,
    debug: {
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      selectedDay: itineraryManagement.selectedItineraryDay,
      showItinerary: uiVisibility.showItinerary,
    },
  } : null;

  const mainPanelProps = !isGeneratingItinerary && !shouldShowItineraryView ? {
    leftPanelContainerProps: {
      showItinerary: uiVisibility.showItinerary,
      onSetShowItinerary: uiVisibility.setShowItinerary,
      selectedPlaces: placesManagement.selectedPlaces,
      onRemovePlace: placesManagement.handleRemovePlace,
      onViewOnMap: placesManagement.handleViewOnMap,
      allCategoriesSelected: placesManagement.allCategoriesSelected,
      dates: {
        startDate: tripDetails.dates?.startDate || null,
        endDate: tripDetails.dates?.endDate || null,
        startTime: tripDetails.dates?.startTime || "09:00",
        endTime: tripDetails.dates?.endTime || "21:00",
      },
      onCreateItinerary: handleCreateItineraryWithLoading,
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      isGenerating: isGeneratingItinerary, // Use hook state
    },
    leftPanelContentProps: {
      onDateSelect: tripDetails.setDates,
      onOpenRegionPanel: () => regionSelection.setRegionSlidePanelOpen(true),
      hasSelectedDates: !!tripDetails.dates.startDate && !!tripDetails.dates.endDate,
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
      onConfirmCategoryCallbacks: { 
        accomodation: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('숙소', finalKeywords),
        landmark: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('관광지', finalKeywords),
        restaurant: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('음식점', finalKeywords),
        cafe: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('카페', finalKeywords),
      },
      handlePanelBackCallbacks: { 
        accomodation: () => handlePanelBackByCategory('숙소'),
        landmark: () => handlePanelBackByCategory('관광지'),
        restaurant: () => handlePanelBackByCategory('음식점'),
        cafe: () => handlePanelBackByCategory('카페'),
      },
      isCategoryButtonEnabled: categorySelection.isCategoryButtonEnabled,
      isGenerating: isGeneratingItinerary, // Use hook state
    },
  } : null;

  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isGeneratingItinerary} // Use hook state
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={itineraryDisplayProps}
        mainPanelProps={mainPanelProps}
      />

      <RegionPanelHandler
        open={regionSelection.regionSlidePanelOpen}
        onClose={() => regionSelection.setRegionSlidePanelOpen(false)}
        selectedRegions={regionSelection.selectedRegions}
        onToggle={regionSelection.handleRegionToggle}
        onConfirm={() => {
          regionSelection.setRegionSlidePanelOpen(false);
          if (regionSelection.selectedRegions.length > 0) {
            regionSelection.setRegionConfirmed(true);
          } else {
             toast.info('지역을 선택해주세요.');
          }
        }}
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={categoryResultHandlers.handleResultClose} // Use from hook
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={categoryResultHandlers.handleConfirmCategoryWithAutoComplete} // Use from hook
      />
      
      <DevDebugInfo
        showItineraryHook={uiVisibility.showItinerary}
        itineraryHook={itineraryManagement.itinerary}
        selectedDayHook={itineraryManagement.selectedItineraryDay}
        isGeneratingPanel={isGeneratingItinerary} // Use hook state
        itineraryReceivedPanel={itineraryReceived} // Use hook state
        tripStartDate={tripDetails.dates?.startDate}
      />
    </div>
  );
};

export default LeftPanel;
