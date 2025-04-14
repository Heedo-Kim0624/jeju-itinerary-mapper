
// LeftPanel.tsx
import React from 'react';
import { useLeftPanelState } from './useLeftPanelState';
import PlannerHeader from './PlannerHeader';
import CategorySelection from './CategorySelection';
import PromptKeywordBox from './PromptKeywordBox';
import ItineraryButton from './ItineraryButton';
import RegionModal from './RegionModal';
import AccomodationPanel from '../middlepanel/AccomodationPanel';
import LandmarkPanel from '../middlepanel/LandmarkPanel';
import RestaurantPanel from '../middlepanel/RestaurantPanel';
import CafePanel from '../middlepanel/CafePanel';
import { LeftPanelProps } from './types';

const LeftPanel: React.FC<LeftPanelProps> = ({ onToggleRegionPanel }) => {
  const {
    // 상태
    showItinerary,
    selectedRegions,
    regionConfirmed,
    categoryOrder,
    categorySelectionConfirmed,
    currentCategoryIndex,
    activeMiddlePanelCategory,
    selectedKeywordsByCategory,
    dates,
    accomodationDirectInput,
    landmarkDirectInput,
    restaurantDirectInput,
    cafeDirectInput,
    regionSelectorOpen,
    promptKeywords,
    
    // 상태 변경 함수
    setShowItinerary,
    setSelectedRegions,
    setRegionConfirmed,
    setCategorySelectionConfirmed,
    setCurrentCategoryIndex,
    setActiveMiddlePanelCategory,
    setRegionSelectorOpen,
    setAccomodationDirectInput,
    setLandmarkDirectInput,
    setRestaurantDirectInput,
    setCafeDirectInput,
    
    // 유틸리티 함수
    handleDateSelect,
    handleCategoryClick,
    handlePanelBack,
    toggleKeyword,
  } = useLeftPanelState();

  // 일정 생성 버튼 클릭 핸들러
  const handleGenerateItinerary = () => {
    console.log('일정생성 버튼 클릭됨', promptKeywords);
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {/* 헤더 및 날짜 선택 */}
            <PlannerHeader 
              onDatesSelected={handleDateSelect} 
              dates={dates} 
              onRegionSelect={() => setRegionSelectorOpen(true)} 
            />

            {/* 카테고리 선택 */}
            {regionConfirmed && (
              <CategorySelection 
                categoryOrder={categoryOrder}
                onSelect={handleCategoryClick}
                onBack={() => {
                  setRegionConfirmed(false);
                  setCategorySelectionConfirmed(false);
                }}
                onConfirm={() => setCategorySelectionConfirmed(true)}
                currentCategoryIndex={currentCategoryIndex}
                activeCategory={activeMiddlePanelCategory}
                categorySelectionConfirmed={categorySelectionConfirmed}
                onCategoryClick={setActiveMiddlePanelCategory}
              />
            )}

            {/* 일정 생성 버튼 */}
            <ItineraryButton
              onGenerateItinerary={handleGenerateItinerary}
              categorySelectionConfirmed={categorySelectionConfirmed}
              categoryOrder={categoryOrder}
              currentCategoryIndex={currentCategoryIndex}
            />
          </div>
        </div>
      )}

      {showItinerary && (
        <div className="absolute inset-0 z-10 bg-white p-4 overflow-y-auto">
          <button
            onClick={() => setShowItinerary(false)}
            className="text-sm text-blue-600 hover:underline mb-4"
          >
            ← 뒤로
          </button>
          {/* ItineraryView 관련 코드는 주석 처리 */}
        </div>
      )}

      {/* 왼쪽 패널 하단에 고정된 프롬프트 키워드 박스 */}
      {regionConfirmed && (
        <div className="absolute bottom-20 left-0 w-[300px] max-h-60 border-t p-4 bg-white overflow-y-auto">
          <PromptKeywordBox keywords={promptKeywords} />
        </div>
      )}

      {/* 카테고리별 패널 렌더링 */}
      {activeMiddlePanelCategory === '숙소' && (
        <AccomodationPanel
          selectedKeywords={selectedKeywordsByCategory['숙소'] || []}
          onToggleKeyword={(kw) => toggleKeyword('숙소', kw)}
          directInputValue={accomodationDirectInput}
          onDirectInputChange={setAccomodationDirectInput}
          onConfirmAccomodation={(finalKeywords) => {
            setSelectedKeywordsByCategory({
              ...selectedKeywordsByCategory,
              숙소: finalKeywords,
            });
            setActiveMiddlePanelCategory(null);
            setCurrentCategoryIndex((prev) => prev + 1);
          }}
          onClose={() => handlePanelBack('숙소')}
        />
      )}

      {activeMiddlePanelCategory === '관광지' && (
        <LandmarkPanel
          selectedKeywords={selectedKeywordsByCategory['관광지'] || []}
          onToggleKeyword={(kw) => toggleKeyword('관광지', kw)}
          directInputValue={landmarkDirectInput}
          onDirectInputChange={setLandmarkDirectInput}
          onConfirmLandmark={(finalKeywords) => {
            setSelectedKeywordsByCategory({
              ...selectedKeywordsByCategory,
              관광지: finalKeywords,
            });
            setActiveMiddlePanelCategory(null);
            setCurrentCategoryIndex((prev) => prev + 1);
          }}
          onClose={() => handlePanelBack('관광지')}
        />
      )}

      {activeMiddlePanelCategory === '음식점' && (
        <RestaurantPanel
          selectedKeywords={selectedKeywordsByCategory['음식점'] || []}
          onToggleKeyword={(kw) => toggleKeyword('음식점', kw)}
          directInputValue={restaurantDirectInput}
          onDirectInputChange={setRestaurantDirectInput}
          onConfirmRestaurant={(finalKeywords) => {
            setSelectedKeywordsByCategory({
              ...selectedKeywordsByCategory,
              음식점: finalKeywords,
            });
            setActiveMiddlePanelCategory(null);
            setCurrentCategoryIndex((prev) => prev + 1);
          }}
          onClose={() => handlePanelBack('음식점')}
        />
      )}

      {activeMiddlePanelCategory === '카페' && (
        <CafePanel
          selectedKeywords={selectedKeywordsByCategory['카페'] || []}
          onToggleKeyword={(kw) => toggleKeyword('카페', kw)}
          directInputValue={cafeDirectInput}
          onDirectInputChange={setCafeDirectInput}
          onConfirmCafe={(finalKeywords) => {
            setSelectedKeywordsByCategory({
              ...selectedKeywordsByCategory,
              카페: finalKeywords,
            });
            setActiveMiddlePanelCategory(null);
            setCurrentCategoryIndex((prev) => prev + 1);
          }}
          onClose={() => handlePanelBack('카페')}
        />
      )}

      {/* 지역 선택 모달 */}
      <RegionModal
        isOpen={regionSelectorOpen}
        selectedRegions={selectedRegions}
        onToggleRegion={(region) => {
          if (selectedRegions.includes(region)) {
            setSelectedRegions(selectedRegions.filter((r) => r !== region));
          } else {
            setSelectedRegions([...selectedRegions, region]);
          }
        }}
        onClose={() => setRegionSelectorOpen(false)}
        onConfirm={() => {
          setRegionSelectorOpen(false);
          setRegionConfirmed(true);
        }}
      />
    </div>
  );
};

export default LeftPanel;
