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
    isGeneratingSchedule, // This is isGeneratingScheduleLocal from useLeftPanel
    uiVisibility, // This contains showItineraryPanel as showItinerary
    itinerary, // This is from useScheduleManagement via useLeftPanel
    selectedItineraryDay,
    handleSelectItineraryDay,
    handleCloseItinerary,
    startDate, // This is tripDetailsHook.dates.startDate from useLeftPanel
    handleGenerateSchedule,
    // forceRefreshCounter, // from useLeftPanel, if needed for debug in LeftPanelContainer
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
      
      const intervalId = setInterval(checkStuckLoading, 5000); // Check every 5s, warn if stuck for >7s based on last update
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
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true); // Assuming true means clearSelection and show results
    return true;
  };

  const handleConfirmCategorySelection = (
    category: CategoryName,
    userSelectedInPanel: Place[], // These are places *newly* selected in the CategoryResultPanel for this category
    recommendedPoolForCategory: Place[] // All recommended places for this category by the backend
  ) => {
    const nDaysInNights = tripDetails.tripDuration; // This is from tripDetailsHook.tripDuration

    console.log(
      `[LeftPanel] '${category}' 카테고리 결과 확인. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[LeftPanel] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      uiVisibility.setShowCategoryResult(null); // Close the category result panel
      return;
    }

    const actualTravelDays = nDaysInNights + 1;
    console.log(`[LeftPanel] 계산된 총 여행일수: ${actualTravelDays}일`);

    if (actualTravelDays <= 0) {
      console.warn(`[LeftPanel] 총 여행일수(${actualTravelDays}일)가 유효하지 않아 자동 보완을 실행할 수 없습니다.`);
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      uiVisibility.setShowCategoryResult(null); // Close the category result panel
      return;
    }
    
    // Call auto-complete places which now handles both adding newly selected and auto-completing
    placesManagement.handleAutoCompletePlaces(
      category,
      // userSelectedInPanel, // This was an old param, handleAutoCompletePlaces now uses its internal state + recommendedPool
      recommendedPoolForCategory, // Pass the full pool
      actualTravelDays
    );
    
    uiVisibility.setShowCategoryResult(null); // Close the category result panel after confirmation
  };

  let mainContent;

  // UPDATED CONDITIONAL RENDERING
  if (isGeneratingSchedule) {
    mainContent = (
      <ScheduleLoadingIndicator 
        text="일정 생성 중..."
        subtext={`${new Date().toLocaleTimeString()} 기준 처리 중`}
      />
    );
  } else if (uiVisibility.showItinerary || (itinerary && itinerary.length > 0)) {
    // If not generating, and either showItinerary is true OR itinerary data exists, show ItineraryView.
    // Ensure itinerary is not null before passing to ItineraryView if relying on its length.
    mainContent = (
      <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
        <ItineraryView
          itinerary={itinerary || []} // Pass empty array if itinerary is null but showItinerary was true
          startDate={startDate || new Date()} // Ensure startDate is not null
          onSelectDay={handleSelectItineraryDay}
          selectedDay={selectedItineraryDay}
          onClose={handleCloseItinerary}
          debug={{ // Pass debug info to ItineraryView
            itineraryLength: itinerary?.length || 0,
            selectedDay: selectedItineraryDay,
            showItinerary: uiVisibility.showItinerary
          }}
        />
      </div>
    );
  } else {
    mainContent = (
      <LeftPanelContainer
        showItinerary={uiVisibility.showItinerary} // This will be false here
        onSetShowItinerary={uiVisibility.setShowItinerary} // Prop for PlaceCart/ItineraryButton if they need to toggle
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
          // Ensure handleGenerateSchedule is called and its boolean return is handled
          // The original was just `onCreateItinerary={handleGenerateSchedule}` which might misinterpret the boolean as event
          handleGenerateSchedule().then((success) => {
            if (success) {
              console.log("일정 생성 시작 성공 - LeftPanelContainer 업데이트");
              // UI should update based on isGeneratingSchedule state change
            } else {
              console.log("일정 생성 시작 실패 - LeftPanelContainer 업데이트");
              // Potentially show a toast or message
            }
          });
          return true; // ItineraryButton expects () => boolean. True indicates attempt was made.
        }}
        itinerary={itinerary} // Pass for debug in LeftPanelContainer
        selectedItineraryDay={selectedItineraryDay} // Pass for potential use if LeftPanelContainer rendered ScheduleViewer
        onSelectDay={handleSelectItineraryDay}     // Pass for potential use
        // Pass additional props for debug UI in LeftPanelContainer if needed
        // isGeneratingScheduleProp={isGeneratingSchedule}
        // forceRefreshCounterProp={forceRefreshCounter}
      >
        <LeftPanelContent
          onDateSelect={tripDetails.setDates} // tripDetails is the hook, so tripDetails.setDates
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
            // Assuming keywordsAndInputs.directInputValues maps CategoryName to string
            숙소: keywordsAndInputs.directInputValues['숙소'] || '',
            관광지: keywordsAndInputs.directInputValues['관광지'] || '',
            음식점: keywordsAndInputs.directInputValues['음식점'] || '',
            카페: keywordsAndInputs.directInputValues['카페'] || ''
          }}
          onDirectInputChange={{
            숙소: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
            관광지: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
            음식점: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
            카페: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value)
          }}
          onConfirmCategory={{
            숙소: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('숙소', finalKeywords),
            관광지: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('관광지', finalKeywords),
            음식점: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('음식점', finalKeywords),
            카페: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('카페', finalKeywords)
          }}
          handlePanelBack={{
            숙소: () => handlePanelBackByCategory('숙소'),
            관광지: () => handlePanelBackByCategory('관광지'),
            음식점: () => handlePanelBackByCategory('음식점'),
            카페: () => handlePanelBackByCategory('카페')
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
            showCategoryResult={uiVisibility.showCategoryResult} // This comes from useLeftPanel -> uiVisibility
            selectedRegions={regionSelection.selectedRegions}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            onClose={handleResultClose}
            onSelectPlace={placesManagement.handleSelectPlace}
            selectedPlaces={placesManagement.selectedPlaces} // Pass currently selected places
            onConfirmCategory={handleConfirmCategorySelection} // Pass the unified confirmation handler
          />
        </>
      )}

      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-800 bg-opacity-80 text-white p-1 text-xs z-[100]">
          <div>LP 로딩: {isGeneratingSchedule ? '⏳' : '✅'} | LP 표시: {uiVisibility.showItinerary ? '✅' : '❌'}</div>
          <div>LP 일정: {itinerary?.length || 0}일 | LP 선택: {selectedItineraryDay || 'none'}</div>
          <div>LP 갱신: {new Date(debugInfo.lastUpdate).toLocaleTimeString()}</div>
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
