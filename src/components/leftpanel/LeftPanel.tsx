import React, { useEffect, useState } from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import RegionPanelHandler from './RegionPanelHandler';
import CategoryResultHandler from './CategoryResultHandler';
import ItineraryView from './ItineraryView';
import { Button } from '@/components/ui/button';
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
    handleCreateItinerary, // This is async () => Promise<boolean>
    handleCloseItinerary
  } = useLeftPanel();

  // 로컬 로딩 상태 관리 추가
  const [isGenerating, setIsGenerating] = useState(false);
  // 일정 생성 이벤트 처리를 위한 상태
  const [itineraryReceived, setItineraryReceived] = useState(false);
  // 빈 일정 패널도 표시하기 위한 강제 표시 상태
  // const [forceShowPanel, setForceShowPanel] = useState(false); // 이제 uiVisibility.showItinerary로 대체됨

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
      // setForceShowPanel(true); // 이제 itineraryCreated 이벤트에서 직접 showItinerary를 true로 설정
      // uiVisibility.setShowItinerary(true); // use-left-panel에서 관리
    }
  }, [
    itineraryManagement.itinerary, 
    uiVisibility.showItinerary, 
    itineraryManagement.selectedItineraryDay,
    isGenerating,
    itineraryReceived,
    // uiVisibility.setShowItinerary // No longer directly set here
  ]);
  
  // 개선된 이벤트 리스너 설정
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[LeftPanel] forceRerender 이벤트 수신. 로딩 상태 해제 시도.");
      setIsGenerating(false); // 로딩 중이었다면 해제
      // setItineraryReceived(true); // 데이터 수신 여부는 itineraryCreated에서 판단
    };
    
    const handleItineraryCreated = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log("[LeftPanel] itineraryCreated 이벤트 수신", detail);
      
      setItineraryReceived(true); // 일정 데이터 수신 (유효 여부와 관계없이)
      setIsGenerating(false); // 로딩 상태 해제
      
      if (detail && detail.itinerary) { // itinerary가 null일 수도 있음 (빈 일정)
        if (detail.itinerary.length > 0) {
          console.log("[LeftPanel] itineraryCreated: 유효한 일정 데이터 확인됨. 패널 표시.");
          // uiVisibility.setShowItinerary(true); // use-left-panel에서 관리
          // setForceShowPanel(true); // use-left-panel에서 관리
        } else {
          console.warn("[LeftPanel] itineraryCreated: 일정이 비어있습니다. 빈 패널 표시.");
          // uiVisibility.setShowItinerary(true); // 오류 시에도 빈 패널 표시 시도
          // setForceShowPanel(true);
          toast.info("생성된 일정이 없습니다. 다른 장소를 선택하거나 조건을 변경해보세요.");
        }
      } else {
        console.error("[LeftPanel] itineraryCreated 이벤트에 itinerary 데이터가 없습니다.");
        // uiVisibility.setShowItinerary(true); // 오류 시에도 빈 패널 표시 시도
        // setForceShowPanel(true);
        toast.error("일정 데이터를 받는데 실패했습니다.");
      }
    };
    
    // rawServerResponseReceived는 use-itinerary에서 처리하고 itineraryCreated를 발생시킴
    // 따라서 LeftPanel에서는 itineraryCreated만 수신하면 됨.

    window.addEventListener('forceRerender', handleForceRerender);
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [uiVisibility.setShowItinerary]); // setShowItinerary는 useLeftPanel에서 오므로 안정적

  // 패널 닫기 핸들러 (뒤로 버튼용)
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
  // LeftPanelContainer의 onCreateItinerary prop 타입은 () => boolean 이므로,
  // 이 함수는 동기��으로 boolean을 반환해야 합니다.
  const handleCreateItineraryWithLoading = () => { // async 키워드 제거
    setItineraryReceived(false); 
    setIsGenerating(true);
    console.log("[LeftPanel] 일정 생성 시작 (동기 호출), isGenerating:", true);
    
    // handleCreateItinerary는 Promise<boolean>을 반환하므로 .then().catch()로 처리
    handleCreateItinerary()
      .then(success => {
        // 로딩 상태 해제 및 UI 표시는 itineraryCreated 이벤트 핸들러에서 담당
        if (success) {
          console.log("[LeftPanel] handleCreateItinerary Promise 성공. 이벤트 대기 중...");
          // 안전장치: 15초 후에도 로딩 중이면 강제로 상태 업데이트 시도
          setTimeout(() => {
            // setIsGenerating의 최신 상태를 확인하기 위해 함수형 업데이트를 사용하거나,
            // 이 시점의 isGenerating 상태를 직접 참조합니다.
            // 여기서는 isGenerating 상태를 직접 확인합니다.
            // useState의 isGenerating 상태를 직접 참조합니다.
            // 클로저 문제를 피하려면 이 부분에서 isGenerating 상태를 다시 가져오거나,
            // 혹은 isGenerating 상태를 업데이트하는 로직이 timeout 내부에서 올바르게 동작하도록 해야합니다.
            // 간단하게는, 상태가 아직 true이면 업데이트합니다.
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
        // 이 함수는 boolean을 반환해야 하지만, 실제 성공 여부는 비동기적으로 결정됩니다.
        // Prop 타입에 맞추기 위해 true를 반환하고, 실제 로직은 Promise 내부에서 처리합니다.
      })
      .catch(error => {
        console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error);
        setIsGenerating(false);
        setItineraryReceived(false);
        toast.error("일정 생성 중 내부 오류가 발생했습니다.");
      });

    return true; // Prop 타입 () => boolean을 만족시키기 위해 동기적으로 true 반환
  };
  
  // shouldShowItineraryView는 이제 useLeftPanel의 uiVisibility.showItinerary를 직접 사용
  const shouldShowItineraryView = uiVisibility.showItinerary;

  useEffect(() => {
    console.log("LeftPanel - ItineraryView 표시 결정 로직:", {
      showItineraryFromHook: uiVisibility.showItinerary,
      isGenerating,
      itineraryExists: !!itineraryManagement.itinerary,
      itineraryLength: itineraryManagement.itinerary?.length || 0,
      // forceShowPanel은 이제 사용하지 않음
      최종결과_shouldShowItineraryView: shouldShowItineraryView
    });
  }, [uiVisibility.showItinerary, isGenerating, itineraryManagement.itinerary, shouldShowItineraryView]);

  return (
    <div className="relative h-full">
      {isGenerating ? (
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-[60] shadow-lg"> {/* z-index 증가 */}
          <ScheduleLoadingIndicator 
            text="일정을 생성하는 중..." 
            subtext="잠시만 기다려주세요"
          />
        </div>
      ) : shouldShowItineraryView ? (
         // z-index는 LeftPanelContainer보다 높게 설정해야 함
        <div className="fixed top-0 left-0 w-[300px] h-full bg-white border-r border-gray-200 z-[60] shadow-lg"> {/* z-index 증가 */}
          <div className="absolute top-2 right-2 z-10"> {/* 버튼 z-index도 패널 내에서 유효하게 */}
            <Button 
              variant="ghost" 
              onClick={handleClosePanelWithBackButton}
              className="rounded-full bg-white shadow-sm hover:bg-gray-100 text-blue-500 font-medium px-3 py-1 text-sm" // 스타일 조정
            >
              뒤로
            </Button>
          </div>
          <ItineraryView
            itinerary={itineraryManagement.itinerary || []}
            startDate={tripDetails.dates?.startDate || new Date()}
            onSelectDay={itineraryManagement.handleSelectItineraryDay}
            selectedDay={itineraryManagement.selectedItineraryDay}
            onClose={handleCloseItinerary} // This should set showItinerary to false
            debug={{
              itineraryLength: itineraryManagement.itinerary?.length || 0,
              selectedDay: itineraryManagement.selectedItineraryDay,
              showItinerary: uiVisibility.showItinerary
            }}
          />
        </div>
      ) : (
        // z-index 50 for LeftPanelContainer
        <LeftPanelContainer
          showItinerary={uiVisibility.showItinerary} // 이 prop은 이제 직접적인 제어보다는 상태 반영용
          onSetShowItinerary={uiVisibility.setShowItinerary} // 이 함수는 여전히 필요 (e.g. 하단 버튼 토글)
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
              isGenerating={isGenerating} // isGenerating 상태 전달
            />
          }
          dates={{
            startDate: tripDetails.dates?.startDate || null,
            endDate: tripDetails.dates?.endDate || null,
            startTime: tripDetails.dates?.startTime || "09:00",
            endTime: tripDetails.dates?.endTime || "21:00"
          }}
          onCreateItinerary={handleCreateItineraryWithLoading} // 수��된 함수 사용
          itinerary={itineraryManagement.itinerary} // 상태 반영용
          selectedItineraryDay={itineraryManagement.selectedItineraryDay} // 상태 반영용
          onSelectDay={itineraryManagement.handleSelectItineraryDay} // 상태 반영용
          isGenerating={isGenerating} // isGenerating 상태 전달
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
        <div className="fixed bottom-4 left-4 bg-black bg-opacity-70 text-white p-2 rounded text-xs z-[100]"> {/* Debug 패널 z-index 최상위 */}
          [Dev Debug Info]<br/>
          LP.showItinerary (Hook): {uiVisibility.showItinerary ? 'true' : 'false'}<br />
          {/* forceShowPanel: {forceShowPanel ? 'true' : 'false'}<br /> */}
          LP.itinerary (Hook): {itineraryManagement.itinerary ? `${itineraryManagement.itinerary.length}일 (${itineraryManagement.itinerary[0]?.places?.length || 0}곳)` : 'null'}<br />
          LP.selectedDay (Hook): {itineraryManagement.selectedItineraryDay || 'null'}<br />
          LP.isGenerating: {isGenerating ? 'true' : 'false'}<br />
          LP.itineraryReceived: {itineraryReceived ? 'true' : 'false'}<br />
          Trip Start: {tripDetails.dates?.startDate?.toLocaleDateString()}
        </div>
      )}
    </div>
  );
};

export default LeftPanel;
