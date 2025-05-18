
import React, { useState, useEffect } from 'react';
import LeftPanelContainer from './LeftPanelContainer'; // 원본 파일에 있었지만, 사용자 프롬프트에서는 누락. 아마도 LeftPanelCoreContent가 Container 내부에 렌더링되므로 직접 사용하지 않을 수 있음. 하지만 하단 ItineraryButton 때문에 필요함.
import LeftPanelContent from './LeftPanelContent';
import { Place } from '@/types/supabase';
import { ItineraryDay } from '@/hooks/use-itinerary';
import { CategoryName } from '@/utils/categoryUtils'; // For onConfirmCategory type
import PlaceCart from './PlaceCart'; // 사용자 프롬프트에 따라 추가
import ItineraryButton from './ItineraryButton'; // 사용자 프롬프트에 따라 추가

// Props for LeftPanelContainer
interface LeftPanelContainerSharedProps {
  selectedPlaces: Place[];
  onRemovePlace: (id: string) => void;
  onViewOnMap: (place: Place) => void;
  allCategoriesSelected: boolean;
  dates: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  } | null;
  onCreateItinerary: () => boolean;
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  onSelectDay: (day: number) => void;
}

// Props for LeftPanelContent
interface LeftPanelContentSharedProps {
  onDateSelect: (dates: { startDate: Date; endDate: Date; startTime: string; endTime: string; }) => void;
  onOpenRegionPanel: () => void;
  hasSelectedDates: boolean;
  onCategoryClick: (category: string) => void;
  regionConfirmed: boolean;
  categoryStepIndex: number;
  activeMiddlePanelCategory: string | null;
  confirmedCategories: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  toggleKeyword: (category: string, keyword: string) => void;
  directInputValues: { accomodation: string; landmark: string; restaurant: string; cafe: string; };
  onDirectInputChange: {
    accomodation: (value: string) => void;
    landmark: (value: string) => void;
    restaurant: (value: string) => void;
    cafe: (value: string) => void;
  };
  onConfirmCategoryInContent: {
    accomodation: (finalKeywords: string[]) => boolean;
    landmark: (finalKeywords: string[]) => boolean;
    restaurant: (finalKeywords: string[]) => boolean;
    cafe: (finalKeywords: string[]) => boolean;
  };
  handlePanelBack: {
    accomodation: () => void;
    landmark: () => void;
    restaurant: () => void;
    cafe: () => void;
  };
  isCategoryButtonEnabled: (category: string) => boolean;
}

interface LeftPanelCoreContentProps extends LeftPanelContainerSharedProps, LeftPanelContentSharedProps {
  showItinerary: boolean; // Prop for LeftPanelContainer (though LeftPanelCoreContent might not use it directly)
  onSetShowItinerary: (show: boolean) => void; // Prop for LeftPanelContainer (though LeftPanelCoreContent might not use it directly)
  isGenerating?: boolean; // 추가: 일정 생성 중 상태
}

const LeftPanelCoreContent: React.FC<LeftPanelCoreContentProps> = (props) => {
  const {
    // Container props
    showItinerary,
    onSetShowItinerary,
    selectedPlaces,
    onRemovePlace,
    onViewOnMap,
    allCategoriesSelected,
    dates,
    onCreateItinerary,
    itinerary,
    selectedItineraryDay,
    onSelectDay,
    // Content props
    onDateSelect,
    onOpenRegionPanel,
    hasSelectedDates,
    onCategoryClick,
    regionConfirmed,
    categoryStepIndex,
    activeMiddlePanelCategory,
    confirmedCategories,
    selectedKeywordsByCategory,
    toggleKeyword,
    directInputValues,
    onDirectInputChange,
    onConfirmCategoryInContent,
    handlePanelBack,
    isCategoryButtonEnabled,
    // New prop
    isGenerating = false, // 기본값 false
  } = props;

  const [localIsGenerating, setLocalIsGenerating] = useState(isGenerating);

  useEffect(() => {
    console.log("[LeftPanelCoreContent] isGenerating prop 변경:", isGenerating);
    setLocalIsGenerating(isGenerating);
  }, [isGenerating]);

  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanelCoreContent] forceRerender 이벤트 수신, 로딩 상태 확인");
      setLocalIsGenerating(false);
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
    };
  }, []);

  return (
    // The user's prompt suggested modifying LeftPanelCoreContent to look like LeftPanelContainer.
    // However, LeftPanelCoreContent is intended to BE the content *inside* LeftPanelContainer.
    // The original structure was:
    // LeftPanelContainer -> renders children (LeftPanelContent) + PlaceCart + ItineraryButton
    // LeftPanelCoreContent -> wraps LeftPanelContainer and LeftPanelContent
    // This was a bit tangled. The refactoring aimed to make LeftPanelCoreContent the main "non-itinerary" view
    // which then *uses* LeftPanelContainer for its shell.
    // The user's new JSX for LeftPanelCoreContent essentially re-implements LeftPanelContainer's structure.
    // I will follow the user's provided JSX structure for LeftPanelCoreContent.
    <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md flex flex-col">
      <div className="flex-1 overflow-auto">
        {/* This implies LeftPanelContent should be the child here */}
        <LeftPanelContent
          onDateSelect={onDateSelect}
          onOpenRegionPanel={onOpenRegionPanel}
          hasSelectedDates={hasSelectedDates}
          onCategoryClick={onCategoryClick}
          regionConfirmed={regionConfirmed}
          categoryStepIndex={categoryStepIndex}
          activeMiddlePanelCategory={activeMiddlePanelCategory}
          confirmedCategories={confirmedCategories}
          selectedKeywordsByCategory={selectedKeywordsByCategory}
          toggleKeyword={toggleKeyword}
          directInputValues={directInputValues}
          onDirectInputChange={onDirectInputChange}
          onConfirmCategory={onConfirmCategoryInContent}
          handlePanelBack={handlePanelBack}
          isCategoryButtonEnabled={isCategoryButtonEnabled}
        />
      </div>
      
      <div className="px-4 py-4 border-t">
        <PlaceCart 
          selectedPlaces={selectedPlaces} 
          onRemovePlace={onRemovePlace}
          onViewOnMap={onViewOnMap}
        />
        
        {localIsGenerating ? (
          <div className="w-full py-3 bg-blue-500 text-white text-center rounded-md flex items-center justify-center mt-4"> {/* Added mt-4 for spacing like ItineraryButton */}
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            일정 생성 중...
          </div>
        ) : (
          <ItineraryButton 
            allCategoriesSelected={allCategoriesSelected}
            onCreateItinerary={onCreateItinerary}
          />
        )}
      </div>
    </div>
  );
};

export default LeftPanelCoreContent;

