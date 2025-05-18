
import React from 'react'; // Removed useEffect, useState
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import CurrentItineraryView from './CurrentItineraryView'; // New component
import LeftPanelCoreContent from './LeftPanelCoreContent'; // New component
import DevelopmentDebugInfo from './DevelopmentDebugInfo'; // New component
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
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
    handleCreateItinerary,
    handleCloseItinerary,
    // currentPanel, // Not directly used in LeftPanel's render, but part of the hook's state
    // isCategoryLoading, // Passed to CategoryResultHandler via props
    // categoryError, // Passed to CategoryResultHandler via props
    // categoryResults, // Passed to CategoryResultHandler via props
  } = useLeftPanel();

  // The useEffect for logging and auto-showing itinerary, and the forceRerender listener,
  // are now handled by useLeftPanelSideEffects.ts, so they are removed from here.

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    uiVisibility.setShowCategoryResult(null);
  };

  // This is for the LeftPanelContent's confirm category (keyword confirmation)
  const handleConfirmCategoryForContent = (category: CategoryName, finalKeywords: string[]): boolean => {
    console.log(`컨텐츠 내 카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true); // true for clearSelection / show result
    return true;
  };

  // This is for the CategoryResultHandler's confirm category (place selection confirmation)
  const handleConfirmCategoryFromResult = (
    category: CategoryName,
    userSelectedInPanel: Place[], // These are places selected within the CategoryResultPanel itself
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;
    console.log(
      `[LeftPanel] '${category}' 카테고리 결과 확인. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[LeftPanel] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      uiVisibility.setShowCategoryResult(null);
      return;
    }

    const actualTravelDays = nDaysInNights + 1;
    console.log(`[LeftPanel] 계산된 총 여행일수: ${actualTravelDays}일`);

    if (actualTravelDays <= 0) {
      console.warn(`[LeftPanel] 총 여행일수(${actualTravelDays}일)가 유효하지 않아 자동 보완을 실행할 수 없습니다.`);
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      uiVisibility.setShowCategoryResult(null);
      return;
    }
    
    // Important: userSelectedInPanel are NEW selections from the result panel.
    // These need to be added to selectedPlaces if not already.
    // The current `placesManagement.handleSelectPlace` expects one place and a boolean.
    // We might need a batch selection handler or iterate.
    // For now, assuming CategoryResultHandler calls handleSelectPlace for each selection.
    // Then, call handleAutoCompletePlaces.
    
    placesManagement.handleAutoCompletePlaces(
      category,
      recommendedPoolForCategory,
      actualTravelDays
    );
    
    uiVisibility.setShowCategoryResult(null);
  };

  const shouldShowItineraryView = uiVisibility.showItinerary && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0;

  return (
    <div className="relative h-full">
      {shouldShowItineraryView ? (
        <CurrentItineraryView
          itinerary={itineraryManagement.itinerary!} // Checked by shouldShowItineraryView
          startDate={tripDetails.dates?.startDate || new Date()}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onClose={handleCloseItinerary}
          debugInfo={{
            itineraryLength: itineraryManagement.itinerary!.length, // Checked
            selectedDay: itineraryManagement.selectedItineraryDay,
            showItinerary: uiVisibility.showItinerary,
          }}
        />
      ) : (
        <LeftPanelCoreContent
          // Props for LeftPanelContainer part
          showItinerary={uiVisibility.showItinerary} // Will be false here
          onSetShowItinerary={uiVisibility.setShowItinerary}
          selectedPlaces={placesManagement.selectedPlaces}
          onRemovePlace={placesManagement.handleRemovePlace}
          onViewOnMap={placesManagement.handleViewOnMap}
          allCategoriesSelected={placesManagement.allCategoriesSelected}
          dates={{
            startDate: tripDetails.dates?.startDate || null,
            endDate: tripDetails.dates?.endDate || null,
            startTime: tripDetails.dates?.startTime || "09:00",
            endTime: tripDetails.dates?.endTime || "21:00",
          }}
          onCreateItinerary={() => {
            handleCreateItinerary().then((success) => {
              if (success) console.log("일정 생성 성공 후 LeftPanelCoreContent 업데이트");
              else console.log("일정 생성 실패 후 LeftPanelCoreContent 업데이트");
            });
            return true; 
          }}
          itinerary={itineraryManagement.itinerary} // Can be null or empty
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          // Props for LeftPanelContent part
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
          directInputValues={{
            accomodation: keywordsAndInputs.directInputValues['숙소'] || '',
            landmark: keywordsAndInputs.directInputValues['관광지'] || '',
            restaurant: keywordsAndInputs.directInputValues['음식점'] || '',
            cafe: keywordsAndInputs.directInputValues['카페'] || '',
          }}
          onDirectInputChange={{
            accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
            landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
            restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
            cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value),
          }}
          onConfirmCategoryInContent={{ // Pass the correct handler
            accomodation: (finalKeywords: string[]) => handleConfirmCategoryForContent('숙소', finalKeywords),
            landmark: (finalKeywords: string[]) => handleConfirmCategoryForContent('관광지', finalKeywords),
            restaurant: (finalKeywords: string[]) => handleConfirmCategoryForContent('음식점', finalKeywords),
            cafe: (finalKeywords: string[]) => handleConfirmCategoryForContent('카페', finalKeywords),
          }}
          handlePanelBack={{
            accomodation: () => handlePanelBackByCategory('숙소'),
            landmark: () => handlePanelBackByCategory('관광지'),
            restaurant: () => handlePanelBackByCategory('음식점'),
            cafe: () => handlePanelBackByCategory('카페'),
          }}
          isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled}
        />
      )}

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
        // selectedKeywordsByCategory is needed by useCategoryResults, not directly here
        // but CategoryResultHandler might need it if it re-fetches or shows keywords.
        // The original CategoryResultHandler props did include it.
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={handleConfirmCategoryFromResult} // Pass the correct handler
      />
      
      <DevelopmentDebugInfo
        showItinerary={uiVisibility.showItinerary}
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
        // isGenerating={...} // isGenerating is not directly available from useLeftPanel hook's return
      />
    </div>
  );
};

export default LeftPanel;
