import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView';
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
    // currentPanel, // Not directly used for ItineraryView vs LeftPanelContainer visibility
    // setCurrentPanel // Not directly used for ItineraryView vs LeftPanelContainer visibility
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


  return (
    <div className="relative h-full">
      {/* 일정 패널 표시 조건: showItinerary가 true일 때 itinerary 데이터가 없더라도 일단 패널을 보여주고,
          ItineraryView 내부에서 "일정 없음" 메시지 등을 처리하도록 변경 */}
      {uiVisibility.showItinerary ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary || []} // itinerary가 null일 경우 빈 배열 전달
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
            onClose={handleCloseItinerary} // onClose prop 유지
            debug={{ // debug prop 유지
              itineraryLength: itineraryManagement.itinerary?.length || 0,
              selectedDay: itineraryManagement.selectedItineraryDay,
              showItinerary: uiVisibility.showItinerary
            }}
          />
        </div>
      ) : (
        <LeftPanelContainer
          showItinerary={uiVisibility.showItinerary} // This will be false here
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
            console.log("[LeftPanel] 일정 생성 버튼 클릭 (컨테이너 내부에서)"); // 요청된 로그 추가
            handleCreateItinerary().then((success) => {
              // 로그 메시지 업데이트
              console.log(`[LeftPanel] 일정 생성 시도 ${success ? '성공' : '실패'} 후 UI 업데이트 로직 실행됨 (컨테이너 내부)`);
              // 성공 시 추가 로직이 필요하면 여기에 구현 (예: 토스트 메시지)
              // if (success) { toast.success("일정 생성 완료!"); } // 이미 useScheduleManagement 등에서 처리할 수 있음
            });
            return true; 
          }}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectDay}
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
        </LeftPanelContainer>
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
        onConfirmCategory={handleConfirmCategory}
      />

      {/* 디버깅용 상태 표시 (개발 중에만 사용) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          showItinerary: {uiVisibility.showItinerary ? 'true' : 'false'}<br />
          itinerary: {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}일` : 'null'}<br />
          selectedDay: {itineraryManagement.selectedItineraryDay || 'null'} <br />
          {/* currentPanel: {currentPanel} Uncomment if currentPanel is returned and needed for debug */}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
