
import React, { useEffect, useState, useCallback } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel'; // Main hook for most panel logic
import { useItinerary } from '@/hooks/use-itinerary'; // Direct use for itinerary state
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
    // uiVisibility, // Will be replaced by showItinerary from useItinerary
    // itineraryManagement, // Will be replaced by direct useItinerary values
    handleCreateItinerary: triggerCreateItineraryFromHook, // Renamed to avoid conflict
    handleCloseItinerary: triggerCloseItineraryFromHook 
  } = useLeftPanel();

  // Direct Itinerary State Management
  const {
    itinerary,
    selectedDay,
    showItinerary, // This is the authoritative showItinerary state
    setItinerary,
    setSelectedDay,
    setShowItinerary,
    onDaySelect, // Standardized day selection handler
    isItineraryCreated
  } = useItinerary();

  const [isGeneratingItinerary, setIsGeneratingItinerary] = useState(false);

  useEffect(() => {
    console.log("[LeftPanel] Relevant state:", {
      showItinerary_from_useItinerary: showItinerary,
      itinerary_from_useItinerary: itinerary ? `${itinerary.length} days` : "null",
      selectedDay_from_useItinerary: selectedDay,
      isItineraryCreated_from_useItinerary: isItineraryCreated,
      isGeneratingItinerary_local: isGeneratingItinerary,
    });
  }, [showItinerary, itinerary, selectedDay, isItineraryCreated, isGeneratingItinerary]);

  // Event listener for 'itineraryCreated' - now handled by useItinerary hook directly.
  // This useEffect can be simplified or removed if useItinerary's internal listener is sufficient.
  // Forcing a re-render or ensuring dependent components update might still be useful.
  useEffect(() => {
    const handleItineraryDataUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[], selectedDay: number | null, showItinerary: boolean }>;
      const { 
        itinerary: eventItinerary, 
        selectedDay: eventSelectedDay, 
        showItinerary: eventShowItinerary 
      } = customEvent.detail;
      
      console.log('[LeftPanel] "itineraryCreated" event noticed by LeftPanel:', {
        eventDetail: customEvent.detail,
        currentState: { showItinerary, itineraryLength: itinerary.length }
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
  }, []); // Minimal dependencies, as useItinerary handles the core update

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    // This setShowCategoryResult is from useLeftPanel -> uiVisibility
    keywordsAndInputs.setShowCategoryResult(null); 
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
      `[LeftPanel] '${category}' 카테고리 결과 확인. 사용자가 패널에서 선택: ${userSelectedInPanel.length}개, 전체 추천 풀: ${recommendedPoolForCategory.length}개. 여행 기간(박): ${nDaysInNights}`
    );

    if (nDaysInNights === null) {
      console.warn("[LeftPanel] 여행 기간(tripDuration)이 null입니다. 자동 보완을 실행할 수 없습니다.");
      toast.error("여행 기간을 먼저 설정해주세요. 날짜 선택 후 다시 시도해주세요.");
      keywordsAndInputs.setShowCategoryResult(null); 
      return;
    }
    const actualTravelDays = nDaysInNights + 1;
    if (actualTravelDays <= 0) {
      toast.error("여행 기간이 올바르게 설정되지 않았습니다. 날짜를 다시 확인해주세요.");
      keywordsAndInputs.setShowCategoryResult(null);
      return;
    }
    placesManagement.handleAutoCompletePlaces(category, recommendedPoolForCategory, actualTravelDays);
    keywordsAndInputs.setShowCategoryResult(null);
  };
  
  const triggerCreateItinerary = useCallback(async () => {
    if (isGeneratingItinerary) return false;
    setIsGeneratingItinerary(true);
    console.log("[LeftPanel] 일정 생성 시작 (triggerCreateItinerary), 로컬 로딩 상태 true");
    
    try {
      // This triggerCreateItineraryFromHook is from useLeftPanel, which internally uses useItineraryActions
      // useItineraryActions dispatches the 'itineraryCreated' event.
      const success = await triggerCreateItineraryFromHook(); 
      
      if (success) {
        console.log("[LeftPanel] triggerCreateItineraryFromHook 호출 성공 (triggerCreateItinerary)");
        // The event listener in useItinerary will handle setting showItinerary, itinerary data etc.
        // setIsGeneratingItinerary(false) will be handled by the event listener noticing 'itineraryCreated'
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

  // Effective show itinerary logic using state from direct useItinerary() call
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
    setShowItinerary(false); // Use setter from local useItinerary
    triggerCloseItineraryFromHook(); // Call original handler from useLeftPanel if it does more cleanup
    console.log("[LeftPanel] ItineraryView closed via local setShowItinerary and triggerCloseItineraryFromHook.");
  };

  return (
    <div className="relative h-full">
      {effectiveShowItinerary && !isGeneratingItinerary ? ( 
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itinerary} // from local useItinerary
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={onDaySelect} // from local useItinerary
            selectedDay={selectedDay} // from local useItinerary
            onClose={closeItineraryView}
          />
        </div>
      ) : (
        <LeftPanelContainer
          // Pass relevant props to LeftPanelContainer. It's read-only, so its internal logic doesn't change.
          // It expects certain props that were previously derived from itineraryManagement or uiVisibility.
          showItinerary={showItinerary} // Pass down the authoritative showItinerary
          onSetShowItinerary={setShowItinerary} // Pass down the setter
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
          itinerary={itinerary} // from local useItinerary
          selectedItineraryDay={selectedDay} // from local useItinerary
          onSelectDay={onDaySelect} // from local useItinerary
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
        showCategoryResult={keywordsAndInputs.showCategoryResult} // from useLeftPanel -> keywordsAndInputs
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={handleConfirmCategorySelection} 
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          LP: showItin (useItin): {showItinerary ? 'T' : 'F'}<br />
          LP: itin (useItin): {itinerary ? `${itinerary.length}d` : 'null'}<br />
          LP: selDay (useItin): {selectedDay || 'null'}<br />
          LP: isGen (local): {isGeneratingItinerary ? 'T' : 'F'}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
