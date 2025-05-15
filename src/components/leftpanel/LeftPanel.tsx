
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { RegionDetails } from '@/types/region';
import { CategoryName } from '@/utils/categoryUtils';
import { useLeftPanel } from '@/hooks/use-left-panel'; // 통합 훅 사용

import RegionPanelHandler from './RegionPanelHandler';
import CategorySelector from './CategorySelector'; // 경로 수정됨
import CategoryResultsPanel from './CategoryResultsPanel';
import { ScheduleGenerator } from './ScheduleGenerator'; // default export 아니므로 {} 사용
import ScheduleViewer from './ScheduleViewer';
import ItineraryButton from './ItineraryButton';

interface LeftPanelProps {
  onClose: () => void; // onClose prop 추가
}

const LeftPanel: React.FC<LeftPanelProps> = ({ onClose }) => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    handleCreateItinerary,
    selectedCategory,
    // showCategoryResultScreen, // 직접 사용되지 않으면 제거 가능
    currentPanel,
    setCurrentPanel, // useLeftPanel에서 반환된 setCurrentPanel 사용
    isCategoryLoading,
    categoryError,
    categoryResults,
    handleCategorySelect,
    handleCloseCategoryResult,
    handleConfirmCategory,
    handleCloseItinerary,
  } = useLeftPanel();

  // LeftPanel 내 지역 상태 관리 (RegionPanelHandler와 연동)
  const [currentSelectedRegions, setCurrentSelectedRegions] = useState<RegionDetails[]>(regionSelection.selectedRegions);

  useEffect(() => {
    setCurrentSelectedRegions(regionSelection.selectedRegions);
  }, [regionSelection.selectedRegions]);
  
  const handleRegionsSelected = (regions: RegionDetails[]) => {
    // useRegionSelection 훅의 onRegionsChange를 호출하여 전역 상태 업데이트
    if (regionSelection.onRegionsChange) {
       regionSelection.onRegionsChange(regions);
    }
    setCurrentSelectedRegions(regions); // 로컬 상태도 업데이트 (필요시)
    // setCurrentPanel('date'); // RegionPanelHandler에서 이미 처리
  };


  // CategorySelector에 필요한 props 준비
  const categorySelectorProps = {
    selectedRegions: currentSelectedRegions,
    selectedCategory: selectedCategory,
    onCategorySelect: handleCategorySelect,
    onClose: () => setCurrentPanel('region'), // 'region'으로 돌아가도록 수정
    onConfirmCategory: handleConfirmCategory, // handleConfirmCategory 전달
    directInputValues: keywordsAndInputs.directInputValues,
    onDirectInputChange: keywordsAndInputs.onDirectInputChange,
    selectedKeywordsByCategory: categorySelection.selectedKeywordsByCategory,
    toggleKeyword: categorySelection.toggleKeyword,
    // setKeywords, clearKeywords는 categorySelection 훅 내부에서 관리되거나,
    // keywordsAndInputs.handleConfirmCategory 등을 통해 간접적으로 관리됨
  };
  
  const getDisplayRegions = (): string[] => {
    if (Array.isArray(regionSelection.selectedRegions)) {
      return regionSelection.selectedRegions.map(region => region.displayName || region.name);
    }
    return [];
  };

  return (
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-50 shadow-md flex flex-col">
      {/* 패널 내용 */}
      {currentPanel === 'region' && (
        <RegionPanelHandler
          onClose={() => setCurrentPanel('date')}
          onRegionsSelected={handleRegionsSelected} // 수정된 핸들러
          selectedRegions={currentSelectedRegions} // 로컬 상태 전달
        />
      )}

      {currentPanel === 'date' && (
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">여행 날짜 선택</h2>
          <p>선택된 지역: {currentSelectedRegions.map(r => r.displayName || r.name).join(', ') || '없음'}</p>
          {/* 날짜 선택 컴포넌트 추가 필요 */}
          <input 
            type="date" 
            value={tripDetails.dates.startDate ? tripDetails.dates.startDate.toISOString().split('T')[0] : ''} 
            onChange={(e) => tripDetails.setDates({ ...tripDetails.dates, startDate: new Date(e.target.value)})}
            className="p-2 border rounded mb-2 w-full"
          />
          <input 
            type="date" 
            value={tripDetails.dates.endDate ? tripDetails.dates.endDate.toISOString().split('T')[0] : ''} 
            onChange={(e) => tripDetails.setDates({ ...tripDetails.dates, endDate: new Date(e.target.value)})}
            className="p-2 border rounded mb-4 w-full"
          />
          <button onClick={() => setCurrentPanel('category')} className="w-full p-2 bg-blue-600 text-white rounded">다음: 카테고리 선택</button>
          <button onClick={() => setCurrentPanel('region')} className="w-full p-2 bg-gray-300 text-black rounded mt-2">이전: 지역 선택</button>
        </div>
      )}

      {currentPanel === 'category' && (
        <CategorySelector {...categorySelectorProps} />
      )}

      {uiVisibility.showCategoryResult && (
        <CategoryResultsPanel
          category={uiVisibility.showCategoryResult}
          regions={getDisplayRegions()}
          keywords={categorySelection.selectedKeywordsByCategory[uiVisibility.showCategoryResult] || []}
          onClose={handleCloseCategoryResult}
          isLoading={isCategoryLoading}
          recommendedPlaces={categoryResults.recommendedPlaces}
          normalPlaces={categoryResults.normalPlaces}
          selectedPlaces={placesManagement.selectedPlaces}
          onSelectPlace={placesManagement.handleSelectPlace}
          isPlaceSelected={(id: string) => placesManagement.selectedPlaces.some(place => place.id === id)}
        />
      )}
      
      {/* currentPanel === 'itinerary' && showItinerary 의 조건은 ScheduleViewer에서 관리 */}
      {/* ScheduleGenerator는 버튼 클릭 시 로직으로 처리, 별도 패널이 아닐 수 있음 */}

      {uiVisibility.showItinerary && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && (
        <ScheduleViewer
          schedule={itineraryManagement.itinerary}
          selectedDay={itineraryManagement.selectedItineraryDay}
          onDaySelect={itineraryManagement.handleSelectItineraryDay}
          onClose={handleCloseItinerary}
          startDate={tripDetails.dates?.startDate || new Date()}
        />
      )}
      
      {/* ItineraryButton은 Footer 개념으로 항상 표시될 수 있음 */}
      <div className="mt-auto p-4 border-t border-gray-200">
        {!uiVisibility.showItinerary && currentPanel !== 'itinerary' && (
          <ItineraryButton
            allCategoriesSelected={placesManagement.allCategoriesSelected}
            onCreateItinerary={async () => {
                const success = await handleCreateItinerary();
                // 성공 여부에 따라 추가 작업 가능
            }}
          />
        )}
         {currentPanel === 'itinerary' && uiVisibility.showItinerary && (
            <button 
                onClick={handleCloseItinerary} 
                className="w-full p-2 bg-red-500 text-white rounded"
            >
                일정 보기 닫기
            </button>
        )}
      </div>
    </div>
  );
};

export default LeftPanel;
