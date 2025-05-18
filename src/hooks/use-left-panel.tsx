import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Place as SupabasePlace, SelectedPlace, CategoryName, SchedulePlace } from '@/types/supabase';
import { useItinerary, ItineraryDay } from './use-itinerary'; // ItineraryDay 임포트 추가
import { useSelectedPlaces } from './use-selected-places';
import { useTripDetails } from './use-trip-details';
import { useCategorySelection } from './use-category-selection';
import { usePanelVisibility } from './use-panel-visibility';
import { useItineraryHandlers } from './left-panel/use-itinerary-handlers'; // 상대 경로 확인
import { useCategoryHandlers } from './left-panel/use-category-handlers';
import { useInputState } from './left-panel/use-input-state';
import { useInputHandlers } from './left-panel/use-input-handlers';
import { usePlaceSelectionLogic } from './places/use-place-selection-logic';
import { useSchedulePayloadBuilder } from './places/use-schedule-payload-builder'; // payload 빌더 임포트
import { useItineraryCreator } from './use-itinerary-creator'; // 클라이언트 측 일정 생성기
import { toast } from 'sonner';


export const useLeftPanel = () => {
  const [currentPanel, setCurrentPanel] = useState<string>('category');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(['제주시']);
  const [isRegionPanelOpen, setIsRegionPanelOpen] = useState<boolean>(false);
  const [showDatepicker, setShowDatepicker] = useState<boolean>(false);

  const { 
    itinerary, 
    setItinerary, // setItinerary 직접 사용 제거 또는 주의 
    selectedItineraryDay, 
    setSelectedItineraryDay,
    showItinerary, 
    setShowItinerary,
    isItineraryCreated, 
    setIsItineraryCreated,
    handleSelectItineraryDay, // useItinerary에서 이름 변경된 핸들러 사용
    generateItinerary // useItinerary에서 추가된 함수
  } = useItinerary();

  const { 
    selectedPlaces, 
    addPlace, 
    removePlace, 
    clearSelectedPlaces, 
    allCategoriesSelected, 
    selectedCategoriesCount 
  } = useSelectedPlaces();

  const { dates, startDatetimeLocal, endDatetimeLocal, handleDateChange, handleTimeChange } = useTripDetails();
  const { selectedCategories, setSelectedCategories, isAllSelected: isAllCategoriesHookSelected, toggleCategory } = useCategorySelection();
  
  const { activeBaseKeywords, setActiveBaseKeywords } = useInputState();
  const { handleKeywordSelect, handleKeywordRemove, handleInputChange, handleSearch } = useInputHandlers(setActiveBaseKeywords);
  const { placeSelectionProps } = usePlaceSelectionLogic();

  const { prepareSchedulePayload } = useSchedulePayloadBuilder(); // Payload 빌더 사용
  const { createItinerary: clientSideCreateItinerary } = useItineraryCreator(); // 클라이언트 일정 생성기

  const { handleCreateItinerary, handleCloseItinerary: performCloseItinerary } = useItineraryHandlers();
  const { handleCategorySelect, handleSelectAllCategories } = useCategoryHandlers(setCurrentPanel, setSelectedCategories, selectedCategories);

  const { isPanelVisible, getPanelVisibilityProps } = usePanelVisibility(currentPanel);

  useEffect(() => {
    const handleItineraryCreatedEvent = (event: CustomEvent) => {
        console.log("[useLeftPanel] 'itineraryCreated' event received in useLeftPanel:", event.detail);
        const { itinerary: newItinerary, selectedDay: newSelectedDay } = event.detail as { itinerary: ItineraryDay[], selectedDay: number | null };
        
        if (newItinerary && Array.isArray(newItinerary)) {
            // setItinerary(newItinerary); // 이제 useItinerary 훅 내부에서 처리
            // setSelectedItineraryDay(newSelectedDay); // 이제 useItinerary 훅 내부에서 처리
            // setShowItinerary(newItinerary.length > 0); // 이제 useItinerary 훅 내부에서 처리
            // setIsItineraryCreated(newItinerary.length > 0); // 이제 useItinerary 훅 내부에서 처리
            if (newItinerary.length > 0) {
                setCurrentPanel('itinerary'); // 일정 생성 성공 시 패널 전환
            }
        } else {
            console.error("[useLeftPanel] 'itineraryCreated' event: newItinerary is invalid");
        }
    };

    window.addEventListener('itineraryCreated', handleItineraryCreatedEvent as EventListener);
    return () => {
        window.removeEventListener('itineraryCreated', handleItineraryCreatedEvent as EventListener);
    };
  }, [setCurrentPanel]); // setItinerary, setSelectedItineraryDay, setShowItinerary, setIsItineraryCreated 제거


  const handleRegionConfirm = (regions: string[]) => {
    setSelectedRegions(regions);
    setIsRegionPanelOpen(false);
    setCurrentPanel('category'); // Or 'date' or 'placeCart' depending on flow
    console.log('Selected regions:', regions);
  };

  const handleDateConfirm = () => {
    if (!dates.startDate || !dates.endDate) {
      toast.error("시작일과 종료일을 모두 선택해주세요.");
      return;
    }
    setShowDatepicker(false);
    setCurrentPanel('placeCart'); // 또는 다음 단계로
  };
  
  const memoizedDates = useMemo(() => dates, [dates]);

  const createItineraryWrapper = useCallback(async () => {
    console.log("[useLeftPanel] createItineraryWrapper 호출됨");
    const success = await handleCreateItinerary(
      { dates: memoizedDates, startDatetime: startDatetimeLocal, endDatetime: endDatetimeLocal },
      selectedPlaces as SupabasePlace[], // 타입 단언 SelectedPlace[] to SupabasePlace[]
      prepareSchedulePayload,
      clientSideCreateItinerary,
      setShowItinerary,
      setCurrentPanel
    );
    if (success) {
      // 'itineraryCreated' 이벤트가 발생하여 setCurrentPanel('itinerary') 등을 처리하므로 여기서는 중복 호출 방지
      console.log("[useLeftPanel] createItineraryWrapper: 일정 생성 프로세스 성공적으로 시작됨.");
    } else {
      console.error("[useLeftPanel] createItineraryWrapper: 일정 생성 프로세스 시작 실패.");
      toast.error("일정 생성에 실패했습니다. 입력값을 확인해주세요.");
    }
    return success;
  }, [
    handleCreateItinerary, 
    memoizedDates, 
    startDatetimeLocal, 
    endDatetimeLocal, 
    selectedPlaces, 
    prepareSchedulePayload, 
    clientSideCreateItinerary,
    setShowItinerary, 
    setCurrentPanel
  ]);

  const closeItineraryPanel = useCallback(() => {
    performCloseItinerary(setShowItinerary, setCurrentPanel);
    clearSelectedPlaces(); // 선택 장소 초기화 추가
    // setIsItineraryCreated(false); // 이제 useItinerary 훅 내부에서 관리
    // setItinerary([]); // 이제 useItinerary 훅 내부에서 관리
    // setSelectedItineraryDay(null); // 이제 useItinerary 훅 내부에서 관리
  }, [performCloseItinerary, setShowItinerary, setCurrentPanel, clearSelectedPlaces]);


  return {
    currentPanel,
    setCurrentPanel,
    selectedRegions,
    setSelectedRegions,
    isRegionPanelOpen,
    setIsRegionPanelOpen,
    showDatepicker,
    setShowDatepicker,
    itinerary,
    selectedItineraryDay,
    showItinerary,
    // setShowItinerary, // 직접 노출 대신 핸들러 사용
    isItineraryCreated,
    // setIsItineraryCreated, // 직접 노출 대신 핸들러 사용
    selectedPlaces,
    addPlace,
    removePlace,
    clearSelectedPlaces,
    allCategoriesSelected,
    selectedCategoriesCount,
    dates,
    startDatetimeLocal,
    endDatetimeLocal,
    handleDateChange,
    handleTimeChange,
    selectedCategories,
    // setSelectedCategories, // 직접 노출 대신 핸들러 사용
    isAllCategoriesHookSelected,
    toggleCategory,
    activeBaseKeywords,
    // setActiveBaseKeywords, // 직접 노출 대신 핸들러 사용
    handleKeywordSelect,
    handleKeywordRemove,
    handleInputChange,
    handleSearch,
    placeSelectionProps,
    handleRegionConfirm,
    handleDateConfirm,
    createItineraryWrapper, // 이름 변경 및 수정된 함수
    handleSelectItineraryDay, // useItinerary에서 가져온 핸들러
    closeItineraryPanel, // 수정된 닫기 핸들러
    handleCategorySelect,
    handleSelectAllCategories,
    isPanelVisible,
    getPanelVisibilityProps,
    generateItinerary // useItinerary에서 추가된 함수
  };
};
