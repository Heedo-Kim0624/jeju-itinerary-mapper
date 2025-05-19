import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { useItinerary, ItineraryDay as HookItineraryDay } from '@/hooks/use-itinerary';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import { Place, SelectedPlace, CategoryName, CategoryNameKorean, toCategoryName, toCategoryNameKorean } from '@/types';
import { toast } from 'sonner';

const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    handleCreateItinerary: triggerCreateItineraryFromHook,
    handleCloseItinerary: triggerCloseItineraryFromHook,
    isGeneratingItinerary: isGeneratingFromHook 
  } = useLeftPanel();

  const {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    setShowItinerary,
    handleSelectItineraryDay,
    isItineraryCreated
  } = useItinerary();

  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(isGeneratingFromHook);
  useEffect(() => {
    setIsGeneratingItinerary(isGeneratingFromHook);
  }, [isGeneratingFromHook]);
  
  const [categoryResultPanelCategory, setCategoryResultPanelCategory] = useState<CategoryName | null>(null);

  useEffect(() => {
    console.log("[LeftPanel] Relevant state:", {
      showItinerary_from_useItinerary: showItinerary,
      itinerary_from_useItinerary: itinerary ? `${itinerary.length} days` : "null",
      selectedDay_from_useItinerary: selectedItineraryDay,
      isItineraryCreated_from_useItinerary: isItineraryCreated,
      isGeneratingItinerary_local: isGeneratingItinerary, // Now reflects hook's state
      isGeneratingItinerary_fromHook: isGeneratingFromHook,
      categoryResultPanelCategory_local: categoryResultPanelCategory,
    });
  }, [showItinerary, itinerary, selectedItineraryDay, isItineraryCreated, isGeneratingItinerary, categoryResultPanelCategory, isGeneratingFromHook]);

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
  }, []); // Removed dependencies as setStates are stable from useItinerary

  const handlePanelBackByCategory = (koreanCategory: CategoryNameKorean) => {
    console.log(`${koreanCategory} 카테고리 패널 뒤로가기`);
    // categorySelection.handlePanelBack expects English CategoryName
    categorySelection.handlePanelBack(toCategoryName(koreanCategory));
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    setCategoryResultPanelCategory(null);
  };

  const handleConfirmByCategoryKeywords = (koreanCategoryString: CategoryNameKorean, finalKeywords: string[]) => {
    const englishCategoryName = toCategoryName(koreanCategoryString);

    // No need for !englishCategoryName check as toCategoryName now always returns a valid CategoryName (or default)
    
    console.log(`카테고리 '${englishCategoryName}' (원래: ${koreanCategoryString}) 키워드 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(englishCategoryName, finalKeywords, true); // true for clearSelection to show result panel
    setCategoryResultPanelCategory(englishCategoryName); 
    return true;
  };
  
  const handleConfirmCategorySelectionAndAutocomplete = ( 
    confirmedEnglishCategory: CategoryName,
    userSelectedInPanel: Place[],
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;
    console.log(
      `[LeftPanel] '${confirmedEnglishCategory}' 카테고리 결과 확인 후 자동완성. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
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
    const confirmedKoreanCategory = toCategoryNameKorean(confirmedEnglishCategory);
    placesManagement.handleAutoCompletePlaces(confirmedKoreanCategory, recommendedPoolForCategory, actualTravelDays);
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
        toast.error("일정 생성에 실패했습니다. 다시 시도해주세��.");
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
  
  return (
    <div className="relative h-full">
      <LeftPanelContainer
        showItinerary={effectiveShowItinerary && !isGeneratingItinerary} 
        onSetShowItinerary={setShowItinerary} 
        selectedPlaces={placesManagement.selectedPlaces as Place[]}
        onRemovePlace={placesManagement.handleRemovePlace}
        onViewOnMap={placesManagement.handleViewOnMap}
        allCategoriesSelected={placesManagement.allCategoriesSelected}
        children={
          <LeftPanelContent
            onDateSelect={tripDetails.setDates}
            onOpenRegionPanel={() => regionSelection.setRegionSlidePanelOpen(true)}
            hasSelectedDates={!!tripDetails.dates.startDate && !!tripDetails.dates.endDate}
            onCategoryClick={(koreanCategory: CategoryNameKorean) => { // onCategoryClick expects Korean
              categorySelection.handleCategoryButtonClick(toCategoryName(koreanCategory));
            }}
            regionConfirmed={regionSelection.regionConfirmed}
            categoryStepIndex={categorySelection.stepIndex}
            activeMiddlePanelCategory={categorySelection.activeMiddlePanelCategory} // English CategoryName | null
            confirmedCategories={categorySelection.confirmedCategories} // English CategoryName[]
            selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
            toggleKeyword={categorySelection.toggleKeyword}
            directInputValues={{ // Ensure keys are correct for LeftPanelContentProps
              accommodation: keywordsAndInputs.directInputValues.accommodation || '',
              landmark: keywordsAndInputs.directInputValues.landmark || '',
              restaurant: keywordsAndInputs.directInputValues.restaurant || '',
              cafe: keywordsAndInputs.directInputValues.cafe || ''
            }}
            onDirectInputChange={{ // Ensure keys are correct
              accommodation: (value: string) => keywordsAndInputs.onDirectInputChange('accommodation', value),
              landmark: (value: string) => keywordsAndInputs.onDirectInputChange('landmark', value),
              restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('restaurant', value),
              cafe: (value: string) => keywordsAndInputs.onDirectInputChange('cafe', value)
            }}
            onConfirmCategory={{  // Ensure keys are correct
              accommodation: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('숙소', finalKeywords),
              landmark: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('관광지', finalKeywords),
              restaurant: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('음식점', finalKeywords),
              cafe: (finalKeywords: string[]) => handleConfirmByCategoryKeywords('카페', finalKeywords)
            }}
            handlePanelBack={{ // Ensure keys are correct
              accommodation: () => handlePanelBackByCategory('숙소'),
              landmark: () => handlePanelBackByCategory('관광지'),
              restaurant: () => handlePanelBackByCategory('음식점'),
              cafe: () => handlePanelBackByCategory('카페')
            }}
            isCategoryButtonEnabled={(koreanCategory: CategoryNameKorean) => // Expects Korean
              categorySelection.isCategoryButtonEnabled(toCategoryName(koreanCategory))
            }
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
        showCategoryResult={categoryResultPanelCategory} // English CategoryName | null
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywords={categoryResultPanelCategory ? (categorySelection.selectedKeywordsByCategory[categoryResultPanelCategory] || []) : []} // Uses English CategoryName as key
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces as SelectedPlace[]}
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
