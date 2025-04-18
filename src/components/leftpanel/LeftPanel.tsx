
// src/components/leftpanel/LeftPanel.tsx  (이 행 삭제 금지)
import React, { useState, useMemo, useEffect } from 'react';
import PanelHeader from './PanelHeader';
import CategoryOrderingStep from './CategoryOrderingStep';
import CategoryNavigation from './CategoryNavigation';
import CategoryPanels from './CategoryPanels';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { useRegionSelection } from '@/hooks/use-region-selection';
import { useTripDetails } from '@/hooks/use-trip-details';
import { useMapContext } from '../rightpanel/MapContext'; // ★ 추가

const LeftPanel: React.FC = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  // ★ 단계 인덱스: 0~categoryOrder.length-1
  const [stepIndex, setStepIndex] = useState(0); // ★ 추가
  // ★ 결과 패널 열기 여부
  const [showCategoryResult, setShowCategoryResult] = useState<null | '숙소' | '관광지' | '음식점' | '카페'>(null);

  const {
    categoryOrder,
    categorySelectionConfirmed,
    setCategorySelectionConfirmed,
    stepIndex: categoryStepIndex,
    activeMiddlePanelCategory,
    selectedKeywordsByCategory,
    handleCategoryClick,
    toggleKeyword,
    handlePanelBack,
    handleConfirmCategory
  } = useCategorySelection();

  const {
    selectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  } = useRegionSelection();

  const {
    dates,
    setDates,
    accomodationDirectInput,
    setAccomodationDirectInput,
    landmarkDirectInput,
    setLandmarkDirectInput,
    restaurantDirectInput,
    setRestaurantDirectInput,
    cafeDirectInput,
    setCafeDirectInput,
    buildPromptKeywords
  } = useTripDetails();

  const promptKeywords = useMemo(() => buildPromptKeywords(), [dates]);

  // ★ 지도 panTo, 마커 제어를 위해
  const { panTo } = useMapContext(); // ★ 추가

  // 날짜·지역 확정 후 첫 카테고리 자동 오픈
  useEffect(() => {
    if (regionConfirmed && categorySelectionConfirmed && stepIndex === 0) {
      // 첫번째 카테고리를 열어줍니다
      if (categoryOrder.length > 0) {
        const firstCat = categoryOrder[0];
        // setActiveMiddlePanelCategory는 더 이상 prop으로 받지 않음
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [regionConfirmed, categorySelectionConfirmed]);

  // 키워드 직접입력/변경용 매핑
  const directInputValues = {
    accomodation: accomodationDirectInput,
    landmark:    landmarkDirectInput,
    restaurant:  restaurantDirectInput,
    cafe:        cafeDirectInput
  };
  const onDirectInputChange = {
    accomodation: setAccomodationDirectInput,
    landmark:    setLandmarkDirectInput,
    restaurant:  setRestaurantDirectInput,
    cafe:        setCafeDirectInput
  };

  // ★ 확인 시: 키워드 저장 → 결과 패널 열기 → 지도 줌인
  const handleConfirmByCategory = {
    accomodation: (finalKeywords: string[]) => {
      handleConfirmCategory('숙소', finalKeywords);
      setShowCategoryResult('숙소');
      panTo(selectedRegions[0]);                // ★ 해당 지역으로 줌
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    },
    landmark: (finalKeywords: string[]) => {
      handleConfirmCategory('관광지', finalKeywords);
      setShowCategoryResult('관광지');
      panTo(selectedRegions[0]);
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    },
    restaurant: (finalKeywords: string[]) => {
      handleConfirmCategory('음식점', finalKeywords);
      setShowCategoryResult('음식점');
      panTo(selectedRegions[0]);
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    },
    cafe: (finalKeywords: string[]) => {
      handleConfirmCategory('카페', finalKeywords);
      setShowCategoryResult('카페');
      panTo(selectedRegions[0]);
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    }
  };

  const handlePanelBackByCategory = {
    accomodation: () => handlePanelBack(),
    landmark:    () => handlePanelBack(),
    restaurant:  () => handlePanelBack(),
    cafe:        () => handlePanelBack()
  };

  // ★ 결과 패널 닫기 시: 다음 단계로 이동, 다음 입력 패널 오픈
  const handleResultClose = () => {
    setShowCategoryResult(null);
    const next = stepIndex + 1;
    if (next < categoryOrder.length) {
      setStepIndex(next);
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    } else {
      // 모든 카테고리 완료
      setStepIndex(0);
      // activeMiddlePanelCategory는 hook 내부에서 관리되므로 직접 설정 불필요
    }
  };

  return (
    <div className="relative h-full">
      {!showItinerary && (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 pb-24 space-y-6">
            <PanelHeader 
              onDateSelect={setDates}
              onOpenRegionPanel={() => setRegionSlidePanelOpen(!regionSlidePanelOpen)}
              hasSelectedDates={!!dates}
            />

            <CategoryOrderingStep
              categoryOrder={categoryOrder}
              onCategoryClick={handleCategoryClick}
              onBackToRegionSelect={() => setRegionConfirmed(false)}
              onConfirmCategoryOrder={() => setCategorySelectionConfirmed(true)}
              regionConfirmed={regionConfirmed}
            />

            <CategoryNavigation
              categoryOrder={categoryOrder}
              currentCategoryIndex={categoryStepIndex}
              onCategoryClick={handleCategoryClick}
              categorySelectionConfirmed={categorySelectionConfirmed}
            />

            <CategoryPanels
              activeMiddlePanelCategory={activeMiddlePanelCategory}
              selectedKeywordsByCategory={selectedKeywordsByCategory}
              toggleKeyword={toggleKeyword}
              directInputValues={directInputValues}
              onDirectInputChange={onDirectInputChange}
              onConfirmCategory={handleConfirmByCategory}
              handlePanelBack={handlePanelBackByCategory}
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
        </div>
      )}

      <RegionSlidePanel
        open={regionSlidePanelOpen}
        onClose={() => setRegionSlidePanelOpen(false)}
        selectedRegions={selectedRegions}
        onToggle={handleRegionToggle}
        onConfirm={() => {
          setRegionSlidePanelOpen(false);
          if (selectedRegions.length > 0) setRegionConfirmed(true);
          else alert('지역을 선택해주세요.');
        }}
      />

      {/* 카테고리별 결과 패널 오버레이 */}
      {showCategoryResult && (
        <CategoryResultPanel
          category={showCategoryResult}
          locations={selectedRegions}
          keywords={selectedKeywordsByCategory[showCategoryResult] || []}
          onClose={handleResultClose}         // ★ 수정
        />
      )}
    </div>
  );
};

export default LeftPanel;
