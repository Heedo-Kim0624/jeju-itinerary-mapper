
import React, { useState, useEffect } from 'react'; // useState, useEffect 추가
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import CurrentItineraryView from './CurrentItineraryView';
import LeftPanelCoreContent from './LeftPanelCoreContent';
// import DevelopmentDebugInfo from './DevelopmentDebugInfo'; // DevelopmentDebugInfo 는 JSX 내부에서 직접 처리
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
    handleCreateItinerary, // This is the original from useLeftPanel
    handleCloseItinerary,
    // categoryResults, // Passed to CategoryResultHandler via props
    // isCategoryLoading, // Passed to CategoryResultHandler via props
    // categoryError, // Passed to CategoryResultHandler via props
    // currentPanel, // Not directly used in LeftPanel's render
    isGenerating, // 로딩 상태 from useLeftPanel
    setIsGenerating, // 로딩 상태 설정 함수 from useLeftPanel
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
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true); 
    return true;
  };

  // This is for the CategoryResultHandler's confirm category (place selection confirmation)
  const handleConfirmCategoryFromResult = (
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

  // 일정 생성 함수 수정 (로딩 상태 관리 포함)
  const handleCreateItineraryWithLoading = () => {
    if (setIsGenerating) { // setIsGenerating이 useLeftPanel에서 제공되는지 확인
      setIsGenerating(true);
    }
    console.log("[LeftPanel] 일정 생성 시작, isGenerating:", true);
    
    // useLeftPanel에서 가져온 handleCreateItinerary 호출
    return handleCreateItinerary().then((success) => {
      if (success) {
        console.log("[LeftPanel] 일정 생성 성공");
        // 성공 시 로딩 상태 해제는 useLeftPanelSideEffects의 이벤트 핸들러에서 처리
      } else {
        console.log("[LeftPanel] 일정 생성 실패");
        if (setIsGenerating) {
          setIsGenerating(false); // 실패 시 로딩 상태 즉시 해제
        }
      }
      return success;
    }).catch(error => {
      console.error("[LeftPanel] 일정 생성 중 오류:", error);
      if (setIsGenerating) {
        setIsGenerating(false); // 오류 발생 시 로딩 상태 즉시 해제
      }
      return false;
    });
  };
  
  // forceRerender 이벤트 리스너 추가: useLeftPanelSideEffects에서 처리하므로 여기서는 중복. 삭제.
  // itineraryCreated 이벤트 리스너 추가: useLeftPanelSideEffects에서 처리하므로 여기서는 중복. 삭제.
  
  const shouldShowItineraryView = 
    uiVisibility.showItinerary && 
    itineraryManagement.itinerary && 
    itineraryManagement.itinerary.length > 0 && 
    !isGenerating; // 로딩 중이 아닐 때만 일정 뷰 표시

  return (
    <div className="relative h-full">
      {shouldShowItineraryView ? (
        <CurrentItineraryView
          itinerary={itineraryManagement.itinerary!}
          startDate={tripDetails.dates?.startDate || new Date()}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onClose={handleCloseItinerary}
          debugInfo={{
            itineraryLength: itineraryManagement.itinerary!.length,
            selectedDay: itineraryManagement.selectedItineraryDay,
            showItinerary: uiVisibility.showItinerary,
          }}
        />
      ) : (
        <LeftPanelCoreContent
          // Props for LeftPanelContainer part (passed through LeftPanelCoreContent)
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
            endTime: tripDetails.dates?.endTime || "21:00",
          }}
          onCreateItinerary={() => { // 이 부분은 LeftPanelCoreContent로 전달되어 ItineraryButton에서 사용됨
            handleCreateItineraryWithLoading().then((success) => {
              // 성공/실패 로깅은 handleCreateItineraryWithLoading 내부에서 처리
            });
            return true; 
          }}
          itinerary={itineraryManagement.itinerary} 
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          
          // Props for LeftPanelContent part (passed through LeftPanelCoreContent)
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
          onConfirmCategoryInContent={{ 
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
          isGenerating={isGenerating} // 로딩 상태 전달
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
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={handleConfirmCategoryFromResult}
      />
      
      {/* 디버깅용 상태 표시 (개발 중에만 사용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          showItinerary: {uiVisibility.showItinerary ? 'true' : 'false'}<br />
          itinerary: {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}일` : 'null'}<br />
          selectedDay: {itineraryManagement.selectedItineraryDay || 'null'}<br />
          isGenerating: {isGenerating ? 'true' : 'false'} {/* 로딩 상태 표시 */}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;

