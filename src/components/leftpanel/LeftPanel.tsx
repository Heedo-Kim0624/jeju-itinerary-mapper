import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView';
import { CategoryName } from '@/utils/categoryUtils';
import { Place, ItineraryDay } from '@/types';
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
    handleCloseItinerary
  } = useLeftPanel();

  // Local loading state for the "Create Itinerary" button
  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);

  // Debug log for uiVisibility and itineraryManagement states
  useEffect(() => {
    console.log("[LeftPanel] Relevant state from useLeftPanel:", {
      showItinerary_ui: uiVisibility.showItinerary,
      itinerary_mgmt: itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length} days` : "null",
      selectedDay_mgmt: itineraryManagement.selectedItineraryDay,
      isGeneratingItinerary_local: isGeneratingItinerary,
    });
  }, [uiVisibility.showItinerary, itineraryManagement.itinerary, itineraryManagement.selectedItineraryDay, isGeneratingItinerary]);

  // Event listener for 'itineraryCreated'
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null, showItinerary: boolean }>;
      const { itinerary, selectedDay, showItinerary: eventShowItinerary } = customEvent.detail;
      
      console.log('[LeftPanel] "itineraryCreated" 이벤트 수신:', {
        일정길이: itinerary?.length,
        선택된일자: selectedDay,
        이벤트패널표시: eventShowItinerary,
        현재패널표시상태_before: uiVisibility.showItinerary
      });

      // Check if itineraryManagement and its methods exist before calling
      if (itineraryManagement && typeof itineraryManagement.setItinerary === 'function') {
        itineraryManagement.setItinerary(itinerary || []);
      } else {
        console.warn("[LeftPanel] itineraryManagement.setItinerary is not available.");
      }

      if (itineraryManagement && typeof itineraryManagement.setSelectedItineraryDay === 'function') {
        itineraryManagement.setSelectedItineraryDay(selectedDay);
      } else {
        console.warn("[LeftPanel] itineraryManagement.setSelectedItineraryDay is not available.");
      }
      
      if (uiVisibility && typeof uiVisibility.setShowItinerary === 'function') {
        uiVisibility.setShowItinerary(eventShowItinerary && itinerary && itinerary.length > 0);
         console.log(`[LeftPanel] setShowItinerary(${eventShowItinerary && itinerary && itinerary.length > 0}) 호출됨 (이벤트 핸들러)`);
      } else {
        console.warn("[LeftPanel] uiVisibility.setShowItinerary is not available.");
      }
      setIsGeneratingItinerary(false);
    };
    
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    // Optional: Listen to forceRerender if still needed for other purposes
    const handleForceRerender = () => {
      console.log("[LeftPanel] forceRerender 이벤트 수신. 로딩 상태 재확인.");
    };
    window.addEventListener('forceRerender', handleForceRerender);

    return () => {
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
      window.removeEventListener('forceRerender', handleForceRerender);
    };
  }, [uiVisibility, itineraryManagement]); // Simplified dependency array, ensure itineraryManagement itself is stable or correctly includes its methods.

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

  const handleConfirmCategorySelection = ( 
    category: CategoryName,
    userSelectedInPanel: Place[],
    recommendedPoolForCategory: Place[]
  ) => {
    const nDaysInNights = tripDetails.tripDuration;

    console.log(
      `[LeftPanel] '${category}' 카테고리 결과 확인. 사용자가 패널에서 선��: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
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
  
  const triggerCreateItinerary = useCallback(async () => {
    if (isGeneratingItinerary) return false;

    setIsGeneratingItinerary(true);
    console.log("[LeftPanel] 일정 생성 시작 (triggerCreateItinerary), 로컬 로딩 상태 true");
    
    try {
      const success = await handleCreateItinerary(); 
      
      if (success) {
        console.log("[LeftPanel] handleCreateItinerary 호출 성공 (triggerCreateItinerary)");
      } else {
        console.log("[LeftPanel] handleCreateItinerary 호출 실패 (triggerCreateItinerary)");
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
  }, [handleCreateItinerary, isGeneratingItinerary, setIsGeneratingItinerary]);

  const effectiveShowItinerary = uiVisibility.showItinerary && itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0;

  useEffect(() => {
    console.log("[LeftPanel] Itinerary View 결정 로직:", {
      uiVisibility_showItinerary: uiVisibility.showItinerary,
      itinerary_exists: !!itineraryManagement.itinerary,
      itinerary_length: itineraryManagement.itinerary?.length,
      effectiveShowItinerary,
      isGeneratingItinerary_local: isGeneratingItinerary,
    });
  }, [uiVisibility.showItinerary, itineraryManagement.itinerary, effectiveShowItinerary, isGeneratingItinerary]);

  return (
    <div className="relative h-full">
      {effectiveShowItinerary && !isGeneratingItinerary ? ( 
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary!}
            startDate={tripDetails.dates?.startDate || new Date()}
            onDaySelect={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
            onClose={() => {
              handleCloseItinerary(); 
              console.log("[LeftPanel] ItineraryView closed.");
            }}
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
          children={
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
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          isGenerating={isGeneratingItinerary} 
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
        onConfirmCategory={handleConfirmCategorySelection} 
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          LP: showItin: {uiVisibility.showItinerary ? 'T' : 'F'}<br />
          LP: itin: {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}d` : 'null'}<br />
          LP: selDay: {itineraryManagement.selectedItineraryDay || 'null'}<br />
          LP: isGen: {isGeneratingItinerary ? 'T' : 'F'}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
