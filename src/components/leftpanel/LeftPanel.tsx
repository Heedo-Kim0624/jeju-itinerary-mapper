
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/left-panel/use-left-panel'; // Corrected import path
import ItineraryDisplay from './ItineraryDisplay'; // Renamed from ItineraryPanelWrapper
import SelectionPanelOrContent from './SelectionPanelOrContent'; // Renamed
import ResultPanelHandlers from './panels/ResultPanelHandlers'; // Keep this if it's the correct one for category results
import DebugDisplay from './DebugDisplay'; // Renamed
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useLeftPanelContext } from '@/hooks/left-panel/use-left-panel-context';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiState, // Changed from uiVisibility
    itineraryManagement,
    panelState, // Added
    actions, // Added
    categoryResults // Added
  } = useLeftPanelContext();

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0,
      일정패널표시: uiState.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay,
      현재패널: panelState.currentPanel
    });
  }, [
    itineraryManagement.itinerary,
    uiState.showItinerary,
    itineraryManagement.selectedItineraryDay,
    panelState.currentPanel
  ]);

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    actions.closeCategoryResult();
  };

  const handleConfirmCategoryKeywords = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 키워드 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true); // true to show results
    return true;
  };
  
  const handleConfirmCategorySelection = (
    category: CategoryName,
    userSelectedInPanel: Place[], // These are places selected *within* the category result panel
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;

    console.log(
      `[LeftPanel] '${category}' 카테고리 결과 확인. 패널 내 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[LeftPanel] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      actions.closeCategoryResult();
      return;
    }

    const actualTravelDays = nDaysInNights + 1;
    console.log(`[LeftPanel] 계산된 총 여행일수: ${actualTravelDays}일`);

    if (actualTravelDays <= 0) {
      console.warn(`[LeftPanel] 총 여행일수(${actualTravelDays}일)가 유효하지 않아 자동 보완을 실행할 수 없습니다.`);
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      actions.closeCategoryResult();
      return;
    }
    
    // Add selected places from the panel first
    userSelectedInPanel.forEach(place => {
      if (!placesManagement.isPlaceSelected(place.id, category)) {
        placesManagement.handleSelectPlace(place, true, category);
      }
    });

    placesManagement.handleAutoCompletePlaces(
      category,
      recommendedPoolForCategory,
      actualTravelDays
    );
    
    actions.closeCategoryResult();
  };

  // Adapter for handleSelectPlace for ResultPanelHandlers
  const adaptedHandleSelectPlace = (place: Place) => {
    // Assuming selection in CategoryResultPanel means adding the place.
    // The 'checked' status is implicitly true.
    // The category is uiState.showCategoryResult.
    placesManagement.handleSelectPlace(
      place,
      !placesManagement.isPlaceSelected(place.id, uiState.showCategoryResult), // Toggle selection based on current state
      uiState.showCategoryResult || undefined
    );
  };

  return (
    <div className="relative h-full">
      <ItineraryDisplay
        showItinerary={uiState.showItinerary}
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
        startDate={tripDetails.dates?.startDate}
        handleSelectItineraryDay={itineraryManagement.handleSelectItineraryDay}
        handleCloseItinerary={actions.closeItinerary}
      />
      
      <SelectionPanelOrContent
        showItinerary={uiState.showItinerary}
        // Props for SelectionPanel part
        selectedPlaces={placesManagement.selectedPlaces}
        handleRemovePlace={placesManagement.handleRemovePlace}
        handleViewOnMap={placesManagement.handleViewOnMap}
        allCategoriesSelected={placesManagement.allCategoriesSelected}
        dates={tripDetails.dates}
        handleCreateItinerary={actions.createItinerary}
        // Props for LeftPanelContent part (passed as children conceptually)
        onDateSelect={tripDetails.setDates}
        onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
        hasSelectedDates={!!tripDetails.dates.startDate && !!tripDetails.dates.endDate}
        onCategoryClick={categorySelection.handleCategoryButtonClick}
        regionConfirmed={regionSelection.regionConfirmed}
        categoryStepIndex={categorySelection.stepIndex}
        activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
        confirmedCategories={categorySelection.confirmedCategories}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        toggleKeyword={categorySelection.toggleKeyword}
        directInputValues={keywordsAndInputs.directInputValues}
        onDirectInputChange={keywordsAndInputs.onDirectInputChange}
        onConfirmCategoryKeywords={handleConfirmCategoryKeywords} // Renamed for clarity
        handlePanelBack={handlePanelBackByCategory} // Simplified
        isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled}
      />

      <ResultPanelHandlers
        regionSlidePanelOpen={regionSelection.regionSlidePanelOpen}
        setRegionSlidePanelOpen={regionSelection.setRegionSlidePanelOpen}
        selectedRegions={regionSelection.selectedRegions}
        handleRegionToggle={regionSelection.handleRegionToggle}
        setRegionConfirmed={regionSelection.setRegionConfirmed}
        showCategoryResult={uiState.showCategoryResult} // from uiState
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        handleResultClose={handleResultClose}
        handleSelectPlace={adaptedHandleSelectPlace} // Use the adapter here
        selectedPlaces={placesManagement.selectedPlaces}
        handleConfirmCategory={handleConfirmCategorySelection} // Renamed for clarity
        // Pass new props related to category results data
        isLoading={categoryResults.isLoading}
        error={categoryResults.error}
        recommendedPlaces={categoryResults.recommendedPlaces}
        normalPlaces={categoryResults.normalPlaces}
      />

      <DebugDisplay
        showItinerary={uiState.showItinerary}
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
        currentPanel={panelState.currentPanel}
        showCategoryResult={uiState.showCategoryResult}
      />
    </div>
  );
};

export default LeftPanel;
