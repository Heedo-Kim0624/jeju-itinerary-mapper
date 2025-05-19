
import React, { useEffect, useState } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView';
import { X } from 'lucide-react'; // Import X icon for back button
import { Button } from '@/components/ui/button'; // Import Button component
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { ScheduleLoadingIndicator } from './ScheduleLoadingIndicator';

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

  // 로컬 로딩 상태 관리 추가
  const [isGenerating, setIsGenerating] = useState(false);
  // 일정 생성 이벤트 처리를 위한 상태
  const [itineraryReceived, setItineraryReceived] = useState(false);
  // 빈 일정 패널도 표시하기 위한 강제 표시 상태
  const [forceShowPanel, setForceShowPanel] = useState(false);
  
  // 일정 상태 변화 감지를 위한 useEffect
  useEffect(() => {
    console.log("LeftPanel - 일정 관련 상태 변화 감지:", {
      일정생성됨: !!itineraryManagement.itinerary,
      일정패널표시: uiVisibility.showItinerary,
      강제패널표시: forceShowPanel,
      선택된일자: itineraryManagement.selectedItineraryDay,
      일정길이: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      로딩상태: isGenerating,
      일정수신완료: itineraryReceived
    });
    
    // 로딩이 완료되고 일정 수신이 완료됐으면 강제로 패널을 표시하도록 설정
    if (!isGenerating && itineraryReceived) {
      console.log("LeftPanel - 로딩 완료 및 일정 수신 완료, 패널 강제 표시");
      setForceShowPanel(true);
      uiVisibility.setShowItinerary(true);
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGenerating,
    itineraryReceived,
    uiVisibility.setShowItinerary
  ]);
  
  // 개선된 이벤트 리스너 설정
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanel] forceRerender 이벤트 수신");
      // 강제 리렌더링 이벤트가 발생하면 데이터 확인을 위해 로딩 상태 즉시 해제
      setIsGenerating(false);
    };
    
    const handleItineraryCreated = (event: Event) => {
      console.log("[LeftPanel] itineraryCreated 이벤트 수신", (event as CustomEvent).detail);
      
      // 일정 수신 완료로 표시
      setItineraryReceived(true);
      
      // 일정 데이터 확인
      const detail = (event as CustomEvent).detail;
      if (detail && detail.itinerary && detail.itinerary.length > 0) {
        console.log("[LeftPanel] itineraryCreated 이벤트에서 유효한 일정 데이터 확인:", {
          일정길이: detail.itinerary.length,
          첫날장소수: detail.itinerary[0]?.places?.length || 0
        });
        
        // 로딩 상태 즉시 해제
        setIsGenerating(false);
        
        // 패널 표시 강제 및 일정 패널 표시 활성화
        setForceShowPanel(true);
        uiVisibility.setShowItinerary(true);
      } else {
        console.warn("[LeftPanel] itineraryCreated 이벤트에 유효한 일정 데이터가 없습니다");
        // 로딩 상태 즉시 해제하고 빈 패널이라도 표시
        setIsGenerating(false);
        setForceShowPanel(true);
        uiVisibility.setShowItinerary(true);
        toast.warning("생성된 일정이 비어있습니다. 다른 장소를 선택하고 다시 시도해주세요.");
      }
    };
    
    // itineraryWithCoordinatesReady 이벤트 리스너
    const handleItineraryWithCoords = (event: Event) => {
      console.log("[LeftPanel] itineraryWithCoordinatesReady 이벤트 수신", (event as CustomEvent).detail);
      
      // 좌표가 포함된 일정 데이터 확인
      const detail = (event as CustomEvent).detail;
      if (detail && detail.itinerary && detail.itinerary.length > 0) {
        console.log("[LeftPanel] itineraryWithCoordinatesReady 이벤트에서 유효한 일정 데이터 확인");
        
        // 로딩 상태 즉시 해제
        setIsGenerating(false);
        
        // 패널 표시 강제 및 일정 패널 표시 활성화
        setForceShowPanel(true);
        uiVisibility.setShowItinerary(true);
      }
    };
    
    // rawServerResponseReceived 이벤트 핸들러 - 여기가 핵심!
    const handleRawServerResponse = (event: Event) => {
      console.log("[LeftPanel] rawServerResponseReceived 이벤트 수신", (event as CustomEvent).detail);
      
      // 서버 응답 수신 표시
      setItineraryReceived(true);
      
      // 서버 응답을 받은 후, 짧은 타임아웃 후 상태 업데이트
      setTimeout(() => {
        // 로딩 상태 해제
        setIsGenerating(false);
        
        // 패널 표시 강제 및 일정 패널 표시 활성화 
        setForceShowPanel(true);
        uiVisibility.setShowItinerary(true);
        
        // 유효한 일정 데이터가 아직 없는 경우 사용자에게 알림
        if (!itineraryManagement.itinerary || itineraryManagement.itinerary.length === 0) {
          toast.warning("서버에서 일정을 받았으나 데이터가 비어있습니다. 다시 시도해주세요.");
        }
      }, 500);
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    window.addEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
    window.addEventListener('rawServerResponseReceived', handleRawServerResponse);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
      window.removeEventListener('itineraryWithCoordinatesReady', handleItineraryWithCoords);
      window.removeEventListener('rawServerResponseReceived', handleRawServerResponse);
    };
  }, [itineraryManagement.itinerary, uiVisibility.setShowItinerary]);

  // 패널 닫기 핸들러 (뒤로 버튼용)
  const handleClosePanelWithBackButton = () => {
    console.log("[LeftPanel] 뒤로 버튼으로 패널 닫기");
    setForceShowPanel(false);
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
  
  // 일정 생성 함수 - 로딩 상태 관리 및 이벤트 처리 개선
  const handleCreateItineraryWithLoading = async () => {
    // 먼저 일정 수신 상태 초기화
    setItineraryReceived(false);
    
    // 로딩 상태 설정
    setIsGenerating(true);
    console.log("[LeftPanel] 일정 생성 시작, 로딩 상태:", true);
    
    try {
      const success = await handleCreateItinerary();
      
      if (success) {
        console.log("[LeftPanel] 일정 생성 성공 (handleCreateItineraryWithLoading)");
        // 성공 응답을 받았으나 여기서는 로딩 상태를 유지
        // 이벤트 핸들러에서 실제 데이터 확인 후 상태 변경
        
        // 안전장치: 10초 후에도 로딩 중이면 강제로 해제
        setTimeout(() => {
          if (isGenerating) {
            console.log("[LeftPanel] 10초가 지났는데도 로딩 중. 강제로 로딩 상태 해제");
            setIsGenerating(false);
            setItineraryReceived(true);
            setForceShowPanel(true);
            
            // 일정이 있으면 표시
            if (itineraryManagement.itinerary && itineraryManagement.itinerary.length > 0) {
              uiVisibility.setShowItinerary(true);
            } else {
              toast.warning("일정 생성 시간이 초과되었습니다. 다시 시도해주세요.");
            }
          }
        }, 10000);
      } else {
        console.log("[LeftPanel] 일정 생성 실패 (handleCreateItineraryWithLoading)");
        // 실패 시 로딩 상태 즉시 해제
        setIsGenerating(false);
        setItineraryReceived(false);
      }
      return success;
    } catch (error) {
      console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading):", error);
      // 오류 발생 시 로딩 상태 즉시 해제
      setIsGenerating(false);
      setItineraryReceived(false);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    }
  };
  
  // 개선된 조건부 렌더링: 강제 표시 조건 추가
  const shouldShowItineraryView = 
    (uiVisibility.showItinerary || forceShowPanel) && 
    !isGenerating;

  // 디버깅을 위한 추가 상태 로깅
  useEffect(() => {
    console.log("LeftPanel - shouldShowItineraryView 결정 요소:", {
      showItinerary: uiVisibility.showItinerary,
      forceShowPanel,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary ? itineraryManagement.itinerary.length : 0,
      isGenerating,
      결과: shouldShowItineraryView
    });
  }, [uiVisibility.showItinerary, forceShowPanel, itineraryManagement.itinerary, isGenerating, shouldShowItineraryView]);

  return (
    <div className="relative h-full">
      {isGenerating ? (
        // 로딩 중일 때 로딩 인디케이터 표시 (z-index 값 높게 설정)
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-50 shadow-md">
          <ScheduleLoadingIndicator 
            text="일정을 생성하는 중..." 
            subtext="잠시만 기다려주세요"
          />
        </div>
      ) : shouldShowItineraryView ? (
        // 일정 패널 표시 (z-index 값 높게 설정) - 뒤로 가기 버튼 추가
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-50 shadow-md">
          <div className="absolute top-2 right-2 z-10">
            <Button 
              variant="ghost" 
              onClick={handleClosePanelWithBackButton}
              className="rounded-full bg-white shadow-sm hover:bg-gray-100 text-blue-500 font-medium"
            >
              뒤로
            </Button>
          </div>
          <ItineraryView
            itinerary={itineraryManagement.itinerary || []} // 빈 배열로 폴백하여 에러 방지
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
            onClose={handleCloseItinerary}
            debug={{
              itineraryLength: itineraryManagement.itinerary?.length || 0,
              selectedDay: itineraryManagement.selectedItineraryDay,
              showItinerary: uiVisibility.showItinerary
            }}
          />
        </div>
      ) : (
        // 기본 왼쪽 패널 표시 (일정이 없거나 표시하지 않을 때)
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
              isGenerating={isGenerating}
            />
          }
          dates={{
            startDate: tripDetails.dates?.startDate || null,
            endDate: tripDetails.dates?.endDate || null,
            startTime: tripDetails.dates?.startTime || "09:00",
            endTime: tripDetails.dates?.endTime || "21:00"
          }}
          onCreateItinerary={() => {
            handleCreateItineraryWithLoading();
            return true; 
          }}
          itinerary={itineraryManagement.itinerary}
          selectedItineraryDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          isGenerating={isGenerating}
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
        onConfirmCategory={handleConfirmCategory}
      />
      
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-50">
          showItinerary: {uiVisibility.showItinerary ? 'true' : 'false'}<br />
          forceShowPanel: {forceShowPanel ? 'true' : 'false'}<br />
          itinerary: {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}일` : 'null'}<br />
          selectedDay: {itineraryManagement.selectedItineraryDay || 'null'}<br />
          isGenerating: {isGenerating ? 'true' : 'false'}<br />
          itineraryReceived: {itineraryReceived ? 'true' : 'false'}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
