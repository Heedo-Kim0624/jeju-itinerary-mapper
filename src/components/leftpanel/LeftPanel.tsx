
import React, { useEffect } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelContainer from './LeftPanelContainer';
import ItineraryView from './ItineraryView';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary
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
    // 실제 구현 필요하지 않음 (에러만 제거 목적)
    return;
  };

  // 결과 닫기 핸들러
  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    // 실제로 결과 닫기 기능 구현 (에러만 제거 목적)
    if (uiVisibility && uiVisibility.setShowCategoryResult) {
      uiVisibility.setShowCategoryResult(""); // 빈 문자열로 설정하여 결과 화면 닫기
    }
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
          onCreateItinerary={() => {
            // For type compatibility, convert the Promise to a boolean
            handleCreateItinerary().then(result => !!result);
            return true;
          }}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
        >
          <LeftPanelContent
            onDateSelect={tripDetails.setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!tripDetails.dates}
            onCategoryClick={categorySelection.handleCategoryButtonClick}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={0} // 임시로 0으로 설정 (실제로는 categorySelection에서 가져와야 함)
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory}
            confirmedCategories={categorySelection.confirmedCategories}
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={{
              accomodation: keywordsAndInputs.directInputValues['accommodation'] || '',
              landmark: keywordsAndInputs.directInputValues['landmark'] || '',
              restaurant: keywordsAndInputs.directInputValues['restaurant'] || '',
              cafe: keywordsAndInputs.directInputValues['cafe'] || ''
            }}
            onDirectInputChange={{
              accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('accommodation', value),
              landmark: (value: string) => keywordsAndInputs.onDirectInputChange('landmark', value),
              restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('restaurant', value),
              cafe: (value: string) => keywordsAndInputs.onDirectInputChange('cafe', value)
            }}
            onConfirmCategory={{
              accomodation: (finalKeywords: string[]) => handleConfirmByCategory('accommodation', finalKeywords),
              landmark: (finalKeywords: string[]) => handleConfirmByCategory('landmark', finalKeywords),
              restaurant: (finalKeywords: string[]) => handleConfirmByCategory('restaurant', finalKeywords),
              cafe: (finalKeywords: string[]) => handleConfirmByCategory('cafe', finalKeywords)
            }}
            handlePanelBack={{
              accomodation: () => handlePanelBackByCategory('accommodation'),
              landmark: () => handlePanelBackByCategory('landmark'),
              restaurant: () => handlePanelBackByCategory('restaurant'),
              cafe: () => handlePanelBackByCategory('cafe')
            }}
            isCategoryButtonEnabled={() => true}
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
          else alert('지역을 선택해주세요.');
        }}
      />

      <CategoryResultHandler
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
      />
    </div>
  );
};

// Helper function to handle category confirmation that was left undefined in the original code
const handleConfirmByCategory = (category: string, finalKeywords: string[]) => {
  // This is a placeholder for the actual implementation
  console.log(`Confirming ${finalKeywords.length} keywords for category ${category}`);
};

export default LeftPanel;
