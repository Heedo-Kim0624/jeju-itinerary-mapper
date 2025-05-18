
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import ItineraryPanel from './panels/ItineraryPanel';
import SelectionPanel from './panels/SelectionPanel';
import ResultPanelHandlers from './panels/ResultPanelHandlers';
import DebugPanel from './panels/DebugPanel';

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
  } = useLeftPanel();

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay
    });
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay
  ]);

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    uiVisibility.setShowCategoryResult(null);
  };

  const handleConfirmByCategory = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true);
    return true;
  };

  const handleConfirmCategory = (
    category: CategoryName,
    userSelectedInPanel: Place[],
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
    
    placesManagement.handleAutoCompletePlaces(
      category,
      recommendedPoolForCategory,
      actualTravelDays
    );
    
    uiVisibility.setShowCategoryResult(null);
  };

  // Create an adapter function for handleSelectPlace
  const handleSelectPlaceAdapter = (place: Place) => {
    // Call the original function with default values for the additional parameters
    placesManagement.handleSelectPlace(place, true);
  };

  return (
    <div className="relative h-full">
      {/* 일정 패널 (showItinerary가 true일 때) */}
      <ItineraryPanel
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
        startDate={tripDetails.dates?.startDate}
        handleSelectItineraryDay={itineraryManagement.handleSelectItineraryDay}
        handleCloseItinerary={handleCloseItinerary}
        showItinerary={uiVisibility.showItinerary}
      />
      
      {/* 선택 패널 (showItinerary가 false일 때) */}
      <SelectionPanel
        showItinerary={uiVisibility.showItinerary}
        setShowItinerary={uiVisibility.setShowItinerary}
        selectedPlaces={placesManagement.selectedPlaces}
        handleRemovePlace={placesManagement.handleRemovePlace}
        handleViewOnMap={placesManagement.handleViewOnMap}
        allCategoriesSelected={placesManagement.allCategoriesSelected}
        dates={{
          startDate: tripDetails.dates?.startDate || null,
          endDate: tripDetails.dates?.endDate || null,
          startTime: tripDetails.dates?.startTime || "09:00",
          endTime: tripDetails.dates?.endTime || "21:00"
        }}
        handleCreateItinerary={handleCreateItinerary}
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
        handleSelectItineraryDay={itineraryManagement.handleSelectItineraryDay}
      >
        <LeftPanelContent
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
            cafe: keywordsAndInputs.directInputValues['카페'] || ''
          }}
          onDirectInputChange={{
            accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
            landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
            restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
            cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value)
          }}
          onConfirmCategory={{
            accomodation: (finalKeywords: string[]) => handleConfirmByCategory('숙소', finalKeywords),
            landmark: (finalKeywords: string[]) => handleConfirmByCategory('관광지', finalKeywords),
            restaurant: (finalKeywords: string[]) => handleConfirmByCategory('음식점', finalKeywords),
            cafe: (finalKeywords: string[]) => handleConfirmByCategory('카페', finalKeywords)
          }}
          handlePanelBack={{
            accomodation: () => handlePanelBackByCategory('숙소'),
            landmark: () => handlePanelBackByCategory('관광지'),
            restaurant: () => handlePanelBackByCategory('음식점'),
            cafe: () => handlePanelBackByCategory('카페')
          }}
          isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled}
        />
      </SelectionPanel>

      {/* 결과 패널 핸들러 */}
      <ResultPanelHandlers
        regionSlidePanelOpen={regionSelection.regionSlidePanelOpen}
        setRegionSlidePanelOpen={regionSelection.setRegionSlidePanelOpen}
        selectedRegions={regionSelection.selectedRegions}
        handleRegionToggle={regionSelection.handleRegionToggle}
        setRegionConfirmed={regionSelection.setRegionConfirmed}
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        handleResultClose={handleResultClose}
        handleSelectPlace={handleSelectPlaceAdapter}
        selectedPlaces={placesManagement.selectedPlaces}
        handleConfirmCategory={handleConfirmCategory}
      />

      {/* 디버깅용 상태 패널 */}
      <DebugPanel
        showItinerary={uiVisibility.showItinerary}
        itinerary={itineraryManagement.itinerary}
        selectedItineraryDay={itineraryManagement.selectedItineraryDay}
      />
    </div>
  );
};

export default LeftPanel;
