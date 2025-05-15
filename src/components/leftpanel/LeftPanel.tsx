import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';
import type { CategoryName } from '@/utils/categoryUtils';

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
    categoryResults 
  } = useLeftPanel();

  // 일정 생성 후 UI 상태 변화를 디버깅
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

  // 각 카테고리별로 패널 뒤로가기 함수
  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  // 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    uiVisibility.setShowCategoryResult(null);
  };

  // 카테고리 확인 핸들러
  const handleConfirmByCategory = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    // keywordsAndInputs.handleConfirmCategory의 category 타입을 CategoryName으로 수정했으므로 OK
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true);
    return true;
  };

  return (
    <div className="relative h-full">
      {uiVisibility.showItinerary && itineraryManagement.itinerary ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary}
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
          />
        </div>
      ) : (
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
          onCreateItinerary={async () => { // async 추가
            // handleCreateItinerary가 Promise<boolean>을 반환하도록 수정 필요
            // 또는 여기서 반환값 처리. 현재는 boolean을 기대하므로, Promise 결과를 기다림.
            const result = await handleCreateItinerary();
            return result; // Promise의 결과를 boolean으로 반환
          }}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={tripDetails.setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!tripDetails.dates}
            onCategoryClick={(category) => { // category 타입을 CategoryName으로 명시적 캐스팅
              categorySelection.handleCategoryButtonClick(category as CategoryName);
            }}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={categorySelection.stepIndex}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
            confirmedCategories={categorySelection.confirmedCategories}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={{
              '숙소': keywordsAndInputs.directInputValues['accommodation'] || '',
              '관광지': keywordsAndInputs.directInputValues['landmark'] || '',
              '음식점': keywordsAndInputs.directInputValues['restaurant'] || '',
              '카페': keywordsAndInputs.directInputValues['cafe'] || ''
            }}
            onDirectInputChange={{
              '숙소': (value: string) => keywordsAndInputs.onDirectInputChange('accommodation', value),
              '관광지': (value: string) => keywordsAndInputs.onDirectInputChange('landmark', value),
              '음식점': (value: string) => keywordsAndInputs.onDirectInputChange('restaurant', value),
              '카페': (value: string) => keywordsAndInputs.onDirectInputChange('cafe', value)
            }}
            onConfirmCategory={{ // 키를 CategoryName으로
              '숙소': (finalKeywords: string[]) => handleConfirmByCategory('숙소', finalKeywords),
              '관광지': (finalKeywords: string[]) => handleConfirmByCategory('관광지', finalKeywords),
              '음식점': (finalKeywords: string[]) => handleConfirmByCategory('음식점', finalKeywords),
              '카페': (finalKeywords: string[]) => handleConfirmByCategory('카페', finalKeywords)
            }}
            handlePanelBack={{ // 키를 CategoryName으로
              '숙소': () => handlePanelBackByCategory('숙소'),
              '관광지': () => handlePanelBackByCategory('관광지'),
              '음식점': () => handlePanelBackByCategory('음식점'),
              '카페': () => handlePanelBackByCategory('카페')
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
          if (regionSelection.selectedRegions.length > 0) regionSelection.setRegionConfirmed(true);
          else alert('지역을 선택해주세요.'); // toast.info 등으로 변경 고려
        }}
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult} // CategoryName | null 타입
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
      />
    </div>
  );
};

export default LeftPanel;
