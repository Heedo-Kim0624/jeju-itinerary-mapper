import React, { useEffect, useState } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import LeftPanelDisplayLogic from './LeftPanelDisplayLogic';
import DevDebugInfo from './DevDebugInfo';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
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
    handleCreateItinerary, // This is handleInitiateItineraryCreation from useLeftPanel
    handleCloseItinerary, // This is handleCloseItineraryPanel from useLeftPanel
  } = useLeftPanel();

  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryReceived, setItineraryReceived] = useState(false);

  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay,
      일정길이: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      로딩상태: isGenerating,
      일정수신완료: itineraryReceived
    });
    
    if (!isGenerating && itineraryReceived) {
      console.log("LeftPanel - 로딩 완료 및 일정 수신 완료, 패널 표시 로직은 use-left-panel에서 담당");
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGenerating,
    itineraryReceived,
  ]);
  
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanel] forceRerender 이벤트 수신. 로딩 상태 해제 시도.");
      setIsGenerating(false);
    };
    
    const handleItineraryCreated = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log("[LeftPanel] itineraryCreated 이벤트 수신", detail);
      
      setItineraryReceived(true);
      setIsGenerating(false);
      
      if (detail && detail.itinerary) {
        if (detail.itinerary.length > 0) {
          console.log("[LeftPanel] itineraryCreated: 유효한 일정 데이터 확인됨.");
        } else {
          console.warn("[LeftPanel] itineraryCreated: 일정이 비어있습니다.");
          toast.info("생성된 일정이 없습니다. 다른 장소를 선택하거나 조건을 변경해보세요.");
        }
      } else {
        console.error("[LeftPanel] itineraryCreated 이벤트에 itinerary 데이터가 없습니다.");
        toast.error("일정 데이터를 받는데 실패했습니다.");
      }
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, []); // Removed uiVisibility.setShowItinerary as it's not directly used here for dependency

  const handleClosePanelWithBackButton = () => {
    console.log("[LeftPanel] '뒤로' 버튼으로 패널 닫기 실행");
    handleCloseItinerary(); 
  };

  const handlePanelBackByCategory = (category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    categorySelection.handlePanelBack();
  };

  const handleResultClose = () => {
    console.log("카테고리 결과 화면 닫기");
    uiVisibility.setShowCategoryResult(null);
  };

  const handleConfirmCategoryKeywordSelection = (category: CategoryName, finalKeywords: string[]) => {
    console.log(`카테고리 '${category}' 확인, 키워드: ${finalKeywords.join(', ')}`);
    keywordsAndInputs.handleConfirmCategory(category, finalKeywords, true); // true to show category result panel
    return true;
  };
  
  const handleConfirmCategoryWithAutoComplete = (
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
  
  const handleCreateItineraryWithLoading = () => {
    setItineraryReceived(false); 
    setIsGenerating(true);
    console.log("[LeftPanel] 일정 생성 시작 (동기 호출), isGenerating:", true);
    
    handleCreateItinerary() // This is handleInitiateItineraryCreation from useLeftPanel
      .then(success => {
        if (success) {
          console.log("[LeftPanel] handleCreateItinerary Promise 성공. 이벤트 대기 중...");
          setTimeout(() => {
            if (isGenerating) { 
              console.warn("[LeftPanel] 15초 경과, 여전히 로딩 중. 강제 상태 업데이트 시도.");
              setIsGenerating(false); 
              setItineraryReceived(true); 
              if (!itineraryManagement.itinerary || itineraryManagement.itinerary.length === 0) {
                   toast.warning("일정 생성 시간이 초과되었거나 빈 일정이 생성되었습니다.");
              }
            }
          }, 15000);
        } else {
          console.log("[LeftPanel] handleCreateItinerary Promise 실패.");
          setIsGenerating(false);
          setItineraryReceived(false); 
          toast.error("일정 생성 요청에 실패했습니다.");
        }
      })
      .catch(error => {
        console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error);
        setIsGenerating(false);
        setItineraryReceived(false);
        toast.error("일정 생성 중 내부 오류가 발생했습니다.");
      });

    return true; 
  };
  
  const shouldShowItineraryView = uiVisibility.showItinerary;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직:", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isGeneratingPanelState: isGenerating, // Renamed to avoid conflict in debug
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
  }, [uiVisibility.showItinerary, isGenerating, itineraryManagement.itinerary, shouldShowItineraryView]);

  const itineraryDisplayProps = shouldShowItineraryView ? {
    itinerary: itineraryManagement.itinerary || [],
    startDate: tripDetails.dates?.startDate || new Date(),
    onSelectDay: itineraryManagement.handleSelectItineraryDay,
    selectedDay: itineraryManagement.selectedItineraryDay,
    onCloseItinerary: handleCloseItinerary,
    handleClosePanelWithBackButton,
    debug: {
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      selectedDay: itineraryManagement.selectedItineraryDay,
      showItinerary: uiVisibility.showItinerary,
    },
  } : null;

  const mainPanelProps = !isGenerating && !shouldShowItineraryView ? {
    leftPanelContainerProps: {
      showItinerary: uiVisibility.showItinerary,
      onSetShowItinerary: uiVisibility.setShowItinerary,
      selectedPlaces: placesManagement.selectedPlaces,
      onRemovePlace: placesManagement.handleRemovePlace,
      onViewOnMap: placesManagement.handleViewOnMap,
      allCategoriesSelected: placesManagement.allCategoriesSelected,
      dates: {
        startDate: tripDetails.dates?.startDate || null,
        endDate: tripDetails.dates?.endDate || null,
        startTime: tripDetails.dates?.startTime || "09:00",
        endTime: tripDetails.dates?.endTime || "21:00",
      },
      onCreateItinerary: handleCreateItineraryWithLoading,
      itinerary: itineraryManagement.itinerary,
      selectedItineraryDay: itineraryManagement.selectedItineraryDay,
      onSelectDay: itineraryManagement.handleSelectItineraryDay,
      isGenerating: isGenerating,
    },
    leftPanelContentProps: {
      onDateSelect: tripDetails.setDates,
      onOpenRegionPanel: () => regionSelection.setRegionSlidePanelOpen(true),
      hasSelectedDates: !!tripDetails.dates.startDate && !!tripDetails.dates.endDate,
      onCategoryClick: categorySelection.handleCategoryButtonClick,
      regionConfirmed: regionSelection.regionConfirmed,
      categoryStepIndex: categorySelection.stepIndex,
      activeMiddlePanelCategory: categorySelection.activeMiddlePanelCategory,
      confirmedCategories: categorySelection.confirmedCategories,
      selectedKeywordsByCategory: categorySelection.selectedKeywordsByCategory,
      toggleKeyword: categorySelection.toggleKeyword,
      directInputValues: {
        accomodation: keywordsAndInputs.directInputValues['숙소'] || '',
        landmark: keywordsAndInputs.directInputValues['관광지'] || '',
        restaurant: keywordsAndInputs.directInputValues['음식점'] || '',
        cafe: keywordsAndInputs.directInputValues['카페'] || '',
      },
      onDirectInputChange: {
        accomodation: (value: string) => keywordsAndInputs.onDirectInputChange('숙소', value),
        landmark: (value: string) => keywordsAndInputs.onDirectInputChange('관광지', value),
        restaurant: (value: string) => keywordsAndInputs.onDirectInputChange('음식점', value),
        cafe: (value: string) => keywordsAndInputs.onDirectInputChange('카페', value),
      },
      onConfirmCategoryCallbacks: { // Renamed prop for clarity
        accomodation: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('숙소', finalKeywords),
        landmark: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('관광지', finalKeywords),
        restaurant: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('음식점', finalKeywords),
        cafe: (finalKeywords: string[]) => handleConfirmCategoryKeywordSelection('카페', finalKeywords),
      },
      handlePanelBackCallbacks: { // Renamed prop for clarity
        accomodation: () => handlePanelBackByCategory('숙소'),
        landmark: () => handlePanelBackByCategory('관광지'),
        restaurant: () => handlePanelBackByCategory('음식점'),
        cafe: () => handlePanelBackByCategory('카페'),
      },
      isCategoryButtonEnabled: categorySelection.isCategoryButtonEnabled,
      isGenerating: isGenerating,
    },
  } : null;

  return (
    <div className="relative h-full">
      <LeftPanelDisplayLogic
        isGenerating={isGenerating}
        shouldShowItineraryView={shouldShowItineraryView}
        itineraryDisplayProps={itineraryDisplayProps}
        mainPanelProps={mainPanelProps}
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
        showCategoryResult={uiVisibility.showCategoryResult}
        selectedRegions={regionSelection.selectedRegions}
        selectedKeywordsByCategory={categorySelection.selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={placesManagement.handleSelectPlace}
        selectedPlaces={placesManagement.selectedPlaces}
        onConfirmCategory={handleConfirmCategoryWithAutoComplete}
      />
      
      <DevDebugInfo
        showItineraryHook={uiVisibility.showItinerary}
        itineraryHook={itineraryManagement.itinerary}
        selectedDayHook={itineraryManagement.selectedItineraryDay}
        isGeneratingPanel={isGenerating}
        itineraryReceivedPanel={itineraryReceived}
        tripStartDate={tripDetails.dates?.startDate}
      />
    </div>
  );
};

export default LeftPanel;
