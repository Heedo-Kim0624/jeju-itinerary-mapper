import React, { useEffect, useState } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';
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
    isGeneratingSchedule,
    uiVisibility,
    itinerary,
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleCloseItinerary,
    startDate,
    handleGenerateSchedule
  } = useLeftPanel();

  const [debugInfo, setDebugInfo] = useState({
    lastUpdate: Date.now(),
    isGeneratingScheduleLocal: isGeneratingSchedule,
    showItineraryLocal: uiVisibility.showItinerary,
    itineraryLengthLocal: itinerary?.length || 0,
    selectedDayLocal: selectedItineraryDay
  });

  useEffect(() => {
    const newDebugInfo = {
      lastUpdate: Date.now(),
      isGeneratingScheduleLocal: isGeneratingSchedule,
      showItineraryLocal: uiVisibility.showItinerary,
      itineraryLengthLocal: itinerary?.length || 0,
      selectedDayLocal: selectedItineraryDay
    };
    setDebugInfo(newDebugInfo);
    
    console.log("LeftPanel - 주요 상태 변화 감지:", {
      isGeneratingSchedule,
      showItinerary: uiVisibility.showItinerary,
      itineraryLength: itinerary?.length || 0,
      selectedItineraryDay
    });
  }, [isGeneratingSchedule, uiVisibility.showItinerary, itinerary, selectedItineraryDay]);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const checkStuckLoading = () => {
        if (isGeneratingSchedule && Date.now() - debugInfo.lastUpdate > 7000) {
          console.warn("⚠️ LeftPanel: 일정 생성 로딩이 7초 이상 지속됩니다. 상태 확인 필요:", debugInfo);
        }
      };
      
      const intervalId = setInterval(checkStuckLoading, 5000);
      return () => clearInterval(intervalId);
    }
  }, [isGeneratingSchedule, debugInfo]);

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    uiVisibility.setShowCategoryResult(null);
  };

  const handleConfirmByCategoryKeywords = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true);
    return true;
  };

  const handleConfirmCategorySelection = (
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

  let mainContent;
  if (isGeneratingSchedule) {
    mainContent = (
      <ScheduleLoadingIndicator 
        text="일정 생성 중..."
        subtext={`${new Date().toLocaleTimeString()} 기준 처리 중`}
      />
    );
  } else if (uiVisibility.showItinerary && itinerary && itinerary.length > 0) {
    mainContent = (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ItineraryView
          itinerary={itinerary}
          startDate={startDate || new Date()}
          onSelectDay={handleSelectItineraryDay}
          selectedDay={selectedItineraryDay}
          onClose={handleCloseItinerary}
          debug={{
            itineraryLength: itinerary.length,
            selectedDay: selectedItineraryDay,
            showItinerary: uiVisibility.showItinerary
          }}
        />
      </div>
    );
  } else {
    mainContent = (
      <LeftPanelContainer
        showItinerary={uiVisibility.showItinerary}
        onSetShowItinerary={uiVisibility.setShowItinerary}
        selectedPlaces={placesManagement.selectedPlaces}
        onRemovePlace={placesManagement.handleRemovePlace}
        onViewOnMap={placesManagement.handleViewOnMap}
        allCategoriesSelected={placesManagement.allCategoriesSelected}
        dates={{
          startDate: tripDetails.dates?.startDate || null,
          endDate: tripDetails.dates?.endDate || null,
          startTime: tripDetails.dates?.startTime || "09:00",
          endTime: tripDetails.dates?.endTime || "21:00"
        }}
        onCreateItinerary={() => {
          handleGenerateSchedule().then((success) => {
            if (success) {
              console.log("일정 생성 시작 성공 - LeftPanelContainer 업데이트");
            } else {
              console.log("일정 생성 시작 실패 - LeftPanelContainer 업데이트");
            }
          });
          return true; 
        }}
        itinerary={itinerary}
        selectedItineraryDay={selectedItineraryDay}
        onSelectDay={handleSelectItineraryDay}
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
            accomodation: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('숙소', finalKeywords),
            landmark: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('관광지', finalKeywords),
            restaurant: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('음식점', finalKeywords),
            cafe: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('카페', finalKeywords)
          }}
          handlePanelBack={{
            accomodation: () => handlePanelBackByCategory('숙소'),
            landmark: () => handlePanelBackByCategory('관광지'),
            restaurant: () => handlePanelBackByCategory('음식점'),
            cafe: () => handlePanelBackByCategory('카페')
          }}
          isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled}
        />
      </LeftPanelContainer>
    );
  }

  return (
    <div className="relative h-full">
      {mainContent}

      {!isGeneratingSchedule && !uiVisibility.showItinerary && (
        <>
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
            onClose={handleResultClose}
            onSelectPlace={placesManagement.handleSelectPlace}
            selectedPlaces={placesManagement.selectedPlaces}
            onConfirmCategory={handleConfirmCategorySelection}
          />
        </>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 text-white p-1 text-xs z-[100]">
          <div>로딩: {isGeneratingSchedule ? '⏳' : '✅'} | 표시: {uiVisibility.showItinerary ? '✅' : '❌'}</div>
          <div>일정: {itinerary?.length || 0}일 | 선택: {selectedItineraryDay || 'none'}</div>
          <div>갱신: {new Date(debugInfo.lastUpdate).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
