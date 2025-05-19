import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useItinerary, ItineraryDay as HookItineraryDay } from '@/hooks/use-itinerary'; // Renamed to avoid conflict
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import { CategoryName, Place, SelectedPlace } from '@/types'; // Added CategoryName
import { toast } from 'sonner';

// Helper to map Korean category names to English CategoryName type
const mapKoreanToEnglishCategoryName = (koreanCategory: string): CategoryName | undefined => {
  switch (koreanCategory) {
    case '숙소':
      return 'accommodation';
    case '관광지':
      return 'landmark';
    case '음식점':
      return 'restaurant';
    case '카페':
      return 'cafe';
    default:
      return undefined;
  }
};

// Helper to map English CategoryName back to Korean for selectedKeywordsByCategory lookup
const mapCategoryNameToKorean = (categoryName: CategoryName): string => {
  switch (categoryName) {
    case 'accommodation': return '숙소';
    case 'landmark': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: // Should not happen with CategoryName type
      const exhaustiveCheck: never = categoryName;
      return exhaustiveCheck;
  }
};

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    handleCreateItinerary: triggerCreateItineraryFromHook,
    handleCloseItinerary: triggerCloseItineraryFromHook 
  } = useLeftPanel();

  const {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    // setItinerary, // Removed as per user prompt implies it's not used here, or handled by useItinerary
    // setSelectedItineraryDay, // Removed as per user prompt
    setShowItinerary,
    handleSelectItineraryDay,
    isItineraryCreated
  } = useItinerary();

  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);
  const [categoryResultPanelCategory, setCategoryResultPanelCategory] = useState<CategoryName | null>(null);


  useEffect(() => {
    console.log("[LeftPanel] Relevant state:", {
      showItinerary_from_useItinerary: showItinerary,
      itinerary_from_useItinerary: itinerary ? `${itinerary.length} days` : "null",
      selectedDay_from_useItinerary: selectedItineraryDay,
      isItineraryCreated_from_useItinerary: isItineraryCreated,
      isGeneratingItinerary_local: isGeneratingItinerary,
      categoryResultPanelCategory_local: categoryResultPanelCategory,
    });
  }, [showItinerary, itinerary, selectedItineraryDay, isItineraryCreated, isGeneratingItinerary, categoryResultPanelCategory]);

  // Event listener for 'itineraryCreated' - now handled by useItinerary hook directly.
  // This useEffect can be simplified or removed if useItinerary's internal listener is sufficient.
  // Forcing a re-render or ensuring dependent components update might still be useful.
  useEffect(() => {
    const handleItineraryDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: HookItineraryDay[], selectedDay: number | null, showItinerary: boolean }>;
      const { 
        itinerary: eventItinerary, 
        selectedDay: eventSelectedDay, 
        showItinerary: eventShowItinerary 
      } = customEvent.detail;
      
      console.log('[LeftPanel] "itineraryCreated" event noticed by LeftPanel:', {
        eventDetail: customEvent.detail,
        currentState: { showItinerary, itineraryLength: itinerary?.length }
      });
      // States are already updated by useItinerary's own listener.
      // This component will re-render due to those state changes.
      // Reset local loading state if it was tied to this.
      setIsGeneratingItinerary(false); 
    };
    
    window.addEventListener('itineraryCreated', handleItineraryDataUpdate);
    
    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryDataUpdate);
    };
  }, [showItinerary, itinerary?.length]); // Simplified dependencies as state setters are stable

  const handlePanelBackByCategory = (koreanCategory: string) => { // param is koreanCategory
    console.log(`${koreanCategory} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    setCategoryResultPanelCategory(null);
  };

  // This is called from LeftPanelContent's onConfirmCategory
  const handleConfirmByCategoryKeywords = (koreanCategory: string, finalKeywords: string[]) => {
    const englishCategoryName = mapKoreanToEnglishCategoryName(koreanCategory);
    if (!englishCategoryName) {
      toast.error(`잘못된 카테고리명입니다: ${koreanCategory}`);
      console.error(`Invalid Korean category name for mapping: ${koreanCategory}`);
      return false;
    }

    console.log(`카테고리 '${englishCategoryName}' (원래: ${koreanCategory}) 키워드 확인, 키워드: ${finalKeywords.join(', ')}`);
    // keywordsAndInputs.handleConfirmCategory expects the English CategoryName string.
    // The cast inside use-left-panel will be safe if englishCategoryName is a valid CategoryName.
    keywordsAndInputs.handleConfirmCategory(englishCategoryName, finalKeywords, true);
    setCategoryResultPanelCategory(englishCategoryName); 
    return true;
  };
  
  // This is called from CategoryResultHandler's onConfirmCategory
  const handleConfirmCategorySelectionAndAutocomplete = ( 
    confirmedCategory: CategoryName, // This is already CategoryName
    userSelectedInPanel: Place[],
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;
    console.log(
      `[LeftPanel] '${confirmedCategory}' 카테고리 결과 확인 후 자동완성. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[LeftPanel] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      setCategoryResultPanelCategory(null);
      return;
    }
    const actualTravelDays = nDaysInNights + 1;
    if (actualTravelDays <= 0) {
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      setCategoryResultPanelCategory(null);
      return;
    }
    placesManagement.handleAutoCompletePlaces(confirmedCategory, recommendedPoolForCategory, actualTravelDays);
    setCategoryResultPanelCategory(null); 
  };
  
  const triggerCreateItinerary = useCallback(async () => {
    if (isGeneratingItinerary) return false;
    setIsGeneratingItinerary(true);
    console.log("[LeftPanel] 일정 생성 시작 (triggerCreateItinerary), 로컬 로딩 상태 true");
    
    try {
      const success = await triggerCreateItineraryFromHook(); 
      
      if (success) {
        console.log("[LeftPanel] triggerCreateItineraryFromHook 호출 성공 (triggerCreateItinerary)");
        // setIsGeneratingItinerary(false) will be handled by the event listener or isGenerating prop from container
      } else {
        console.log("[LeftPanel] triggerCreateItineraryFromHook 호출 실패 (triggerCreateItinerary)");
        toast.error("일정 생성에 실패했습니다. 다시 시도해주세요.");
        setIsGeneratingItinerary(false); 
      }
      return success;
    } catch (error) {
      console.error("[LeftPanel] 일정 생성 중 오류 (triggerCreateItinerary):", error);
      toast.error("일정 생성 중 심각한 오류가 발생했습니다.");
      setIsGeneratingItinerary(false); 
      return false;
    }
  }, [triggerCreateItineraryFromHook, isGeneratingItinerary]);

  const effectiveShowItinerary = showItinerary && itinerary && itinerary.length > 0;

  useEffect(() => {
    console.log("[LeftPanel] Itinerary View 결정 로직:", {
      showItinerary_from_useItinerary: showItinerary,
      itinerary_exists: !!itinerary,
      itinerary_length: itinerary?.length,
      effectiveShowItinerary,
      isGeneratingItinerary_local: isGeneratingItinerary,
    });
  }, [showItinerary, itinerary, effectiveShowItinerary, isGeneratingItinerary]);

  const closeItineraryView = () => {
    setShowItinerary(false); 
    triggerCloseItineraryFromHook(); 
    console.log("[LeftPanel] ItineraryView closed via local setShowItinerary and triggerCloseItineraryFromHook.");
  };
  
  // ItineraryView is read-only, LeftPanelContainer uses ScheduleViewer internally when showItinerary is true.
  // The logic here should decide whether to render LeftPanelContainer (which then decides to show ScheduleViewer or its own content)
  // or nothing if some other condition dictates (e.g. full screen map mode, not implemented here).

  // If effectiveShowItinerary is true, LeftPanelContainer will handle displaying ScheduleViewer.
  // Otherwise, LeftPanelContainer displays its normal children (LeftPanelContent etc).
  // The fixed positioning for ItineraryView was removed as LeftPanelContainer handles this now.

  return (
    <div className="relative h-full">
      <LeftPanelContainer
        showItinerary={effectiveShowItinerary && !isGeneratingItinerary} 
        onSetShowItinerary={setShowItinerary} 
        selectedPlaces={placesManagement.selectedPlaces as Place[]} // Cast to Place[]
        onRemovePlace={placesManagement.handleRemovePlace}
        onViewOnMap={placesManagement.handleViewOnMap}
        allCategoriesSelected={placesManagement.allCategoriesSelected}
        children={
          <LeftPanelContent
            onDateSelect={tripDetails.setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!tripDetails.dates.startDate && !!tripDetails.dates.endDate}
            onCategoryClick={(categoryName) => { // categoryName is Korean string e.g. "숙소"
              categorySelection.handleCategoryButtonClick(categoryName);
            }}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={categorySelection.stepIndex}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory} // This is Korean string
            confirmedCategories={categorySelection.confirmedCategories} // Korean strings
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory} // Keys are Korean strings
            toggleKeyword={categorySelection.toggleKeyword} // First arg is Korean string
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
            isCategoryButtonEnabled={categorySelection.isCategoryButtonEnabled} // Arg is Korean string
            isGenerating={isGeneratingItinerary} 
          />
        }
        dates={{
          startDate: tripDetails.dates?.startDate || null,
          endDate: tripDetails.dates?.endDate || null,
          startTime: tripDetails.dates?.startTime || "09:00",
          endTime: tripDetails.dates?.endTime || "21:00"
        }}
        onCreateItinerary={triggerCreateItinerary} 
        itinerary={itinerary} 
        selectedItineraryDay={selectedItineraryDay} 
        onSelectDay={handleSelectItineraryDay}      
        isGenerating={isGeneratingItinerary} 
      />

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
        showCategoryResult={categoryResultPanelCategory} 
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywords={categoryResultPanelCategory ? (categorySelection.selectedKeywordsByCategory[mapCategoryNameToKorean(categoryResultPanelCategory)] || []) : []}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces as SelectedPlace[]} // Cast to SelectedPlace[]
        onConfirmCategory={handleConfirmCategorySelectionAndAutocomplete} 
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          LP: showItin (useItin): {showItinerary ? 'T' : 'F'}<br />
          LP: itin (useItin): {itinerary ? `${itinerary.length}d` : 'null'}<br />
          LP: selDay (useItin): {selectedItineraryDay || 'null'}<br />
          LP: isGen (local): {isGeneratingItinerary ? 'T' : 'F'}<br/>
          LP: catResultPanel: {categoryResultPanelCategory || 'null'}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
