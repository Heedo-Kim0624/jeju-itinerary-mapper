
import React, { useEffect, useState } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView'; // ItineraryView import 확인
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
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
    handleCreateItinerary, // useLeftPanel에서 가져오는 handleCreateItinerary
    handleCloseItinerary // ItineraryView에서 onClose가 필요하다면 이 함수를 전달해야 합니다. 현재 프롬프트에서는 사용되지 않습니다.
  } = useLeftPanel();

  // 로컬 로딩 상태 관리 추가
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Add a dummy state for forceRerender listener in case useLeftPanel doesn't cover all updates.
  // const [, setForceUpdate] = useState(0); // This might be redundant if events cover updates

  // 일정 생성 후 UI 상태 변화를 디버깅
  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      선택된일자: itineraryManagement.selectedItineraryDay,
      일정길이: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      로딩상태: isGenerating // 로딩 상태 로깅 추가
    });
    
    // 일정이 생성되었고 로딩 중이면 로딩 상태 해제
    if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && isGenerating) {
      console.log("LeftPanel - 일정이 생성되었으므로 로딩 상태 해제");
      setIsGenerating(false);
      // 일정이 생성되었으므로, 일정 뷰를 보여주도록 상태 업데이트
      uiVisibility.setShowItinerary(true);
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGenerating, // 의존성 배열에 추가
    uiVisibility.setShowItinerary
  ]);
  
  // forceRerender 및 itineraryCreated 이벤트 리스너 추가
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanel] forceRerender 이벤트 수신, 로딩 상태 해제 시도");
      setIsGenerating(false);
      
      // 일정이 있으면 일정 패널 표시 (이미 위 useEffect에서 처리될 수 있음)
      if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0 && !uiVisibility.showItinerary) {
        console.log("[LeftPanel] forceRerender 후 일정 패널 표시");
        uiVisibility.setShowItinerary(true);
      }
    };
    
    const handleItineraryCreated = () => {
      console.log("[LeftPanel] itineraryCreated 이벤트 수신, 로딩 상태 해제");
      setIsGenerating(false);
      
      // 일정 패널 표시 (이미 위 useEffect 또는 이벤트 핸들러 내부에서 처리될 수 있음)
      // 약간의 지연을 주어 상태 반영 시간을 확보할 수 있습니다.
      setTimeout(() => {
        if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0) {
          console.log("[LeftPanel] itineraryCreated 후 일정 패널 표시");
          uiVisibility.setShowItinerary(true);
        }
      }, 50); // 짧은 지연
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [itineraryManagement.itinerary, uiVisibility.showItinerary, uiVisibility.setShowItinerary]);


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

  const handleConfirmCategory = (
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
  
  // 일정 생성 함수 - 로딩 상태 관리 포함
  const handleCreateItineraryWithLoading = async () => {
    setIsGenerating(true);
    console.log("[LeftPanel] 일정 생성 시작, 로딩 상태:", true);
    
    try {
      const success = await handleCreateItinerary(); // useLeftPanel에서 가져온 원래 함수 호출
      
      if (success) {
        console.log("[LeftPanel] 일정 생성 성공 (handleCreateItineraryWithLoading)");
        // 성공 시, 일정 데이터가 있으면 itineraryManagement.itinerary useEffect에서 setShowItinerary(true) 및 setIsGenerating(false) 처리
      } else {
        console.log("[LeftPanel] 일정 생성 실패 (handleCreateItineraryWithLoading)");
        // 실패 시 로딩 상태 즉시 해제
        setIsGenerating(false);
      }
      return success;
    } catch (error) {
      console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading):", error);
      // 오류 발생 시 로딩 상태 즉시 해제
      setIsGenerating(false);
      return false;
    }
  };
  
  // 조건부 렌더링: 로딩 중이 아닐 때만 일정 뷰를 확실히 표시
  const shouldShowItineraryView = 
    uiVisibility.showItinerary && 
    itineraryManagement.itinerary && 
    itineraryManagement.itinerary.length > 0 &&
    !isGenerating; // 로딩 중이 아닐 때

  return (
    <div className="relative h-full">
      {shouldShowItineraryView ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-40 shadow-md">
          <ItineraryView
            itinerary={itineraryManagement.itinerary!} // Null 체크는 shouldShowItineraryView에서 이미 수행
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
            onClose={handleCloseItinerary} // ItineraryView에 onClose prop 추가
            debug={{ // ItineraryView의 debug prop이 있다면 전달
              itineraryLength: itineraryManagement.itinerary!.length,
              selectedDay: itineraryManagement.selectedItineraryDay,
              showItinerary: uiVisibility.showItinerary
            }}
          />
        </div>
      ) : (
        <LeftPanelContainer
          showItinerary={uiVisibility.showItinerary}
          onSetShowItinerary={uiVisibility.setShowItinerary}
          selectedPlaces={placesManagement.selectedPlaces}
          onRemovePlace={placesManagement.handleRemovePlace} // LeftPanelContainer가 이 prop을 사용하지 않더라도 전달 유지
          onViewOnMap={placesManagement.handleViewOnMap}     // LeftPanelContainer가 이 prop을 사용하지 않더라도 전달 유지
          allCategoriesSelected={placesManagement.allCategoriesSelected}
          dates={{
            startDate: tripDetails.dates?.startDate || null,
            endDate: tripDetails.dates?.endDate || null,
            startTime: tripDetails.dates?.startTime || "09:00",
            endTime: tripDetails.dates?.endTime || "21:00"
          }}
          onCreateItinerary={() => {
            handleCreateItineraryWithLoading(); // 수정된 함수 사용
            return true; 
          }}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          isGenerating={isGenerating} // 로딩 상태 전달
        >
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
            isGenerating={isGenerating} // 로딩 상태 전달
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
        onConfirmCategory={handleConfirmCategory}
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          showItinerary: {uiVisibility.showItinerary ? 'true' : 'false'}<br />
          itinerary: {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}일` : 'null'}<br />
          selectedDay: {itineraryManagement.selectedItineraryDay || 'null'}<br />
          isGenerating: {isGenerating ? 'true' : 'false'}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
