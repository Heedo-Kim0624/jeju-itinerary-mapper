
import { useState, useCallback } from 'react';
import { ItineraryDay } from '@/types/itinerary';
import { CategoryName } from '@/utils/categoryUtils';

export type LeftPanelTab = 'region' | 'date' | 'category' | 'itinerary';

interface UseLeftPanelProps {
  defaultTab?: LeftPanelTab;
}

interface UseLeftPanelReturn {
  // 현재 선택된 탭
  activePanel: LeftPanelTab;
  
  // 각 탭 선택 상태
  isRegionPanelActive: boolean;
  isDatePanelActive: boolean;
  isCategoryPanelActive: boolean;
  isItineraryPanelActive: boolean;
  
  // 일정 관련 상태
  itineraryCreated: boolean;
  itineraryPanelDisplayed: boolean;
  selectedDay: number | null;
  
  // 액션 함수
  setActivePanel: (panel: LeftPanelTab) => void;
  openRegionPanel: () => void;
  openDatePanel: () => void;
  openCategoryPanel: () => void;
  openItineraryPanel: () => void;
  
  // 일정 액션 함수
  setItineraryCreated: (created: boolean) => void;
  setItineraryPanelDisplayed: (displayed: boolean) => void;
  setSelectedDay: (day: number | null) => void;

  // 특정 일자의 장소 목록 반환
  getDayPlaces: (day: number, itinerarySchedule: ItineraryDay[]) => any[] | null;
  findDayByPlaceId: (placeId: string, itinerarySchedule: ItineraryDay[]) => number | null;
  
  // 패널 유틸리티 함수들
  setPanelCategoryWithCategoryName: (categoryName: CategoryName) => void;
}

/**
 * 좌측 패널 상태 및 제어 로직을 제공하는 훅
 * @param defaultTab 초기 활성화할 탭
 */
export const useLeftPanel = ({ defaultTab = 'region' }: UseLeftPanelProps = {}): UseLeftPanelReturn => {
  // 현재 활성화된 탭
  const [activePanel, setActivePanel] = useState<LeftPanelTab>(defaultTab);
  
  // 일정 관련 상태
  const [itineraryCreated, setItineraryCreated] = useState(false);
  const [itineraryPanelDisplayed, setItineraryPanelDisplayed] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // 패널 선택 함수들
  const openRegionPanel = useCallback(() => setActivePanel('region'), []);
  const openDatePanel = useCallback(() => setActivePanel('date'), []);
  const openCategoryPanel = useCallback(() => setActivePanel('category'), []);
  const openItineraryPanel = useCallback(() => setActivePanel('itinerary'), []);

  // 특정 일자의 장소 목록 반환
  const getDayPlaces = useCallback((day: number, itinerarySchedule: ItineraryDay[]): any[] | null => {
    if (!itinerarySchedule || itinerarySchedule.length === 0) return null;
    
    const daySchedule = itinerarySchedule.find(d => d.day === day);
    return daySchedule ? daySchedule.places : null;
  }, []);

  // 특정 장소 ID가 포함된 일자 탐색
  const findDayByPlaceId = useCallback((placeId: string, itinerarySchedule: ItineraryDay[]): number | null => {
    if (!itinerarySchedule || itinerarySchedule.length === 0) return null;
    
    for (const day of itinerarySchedule) {
      if (day.places && day.places.some(place => place.id === placeId)) {
        return day.day;
      }
    }
    return null;
  }, []);

  // 카테고리 탭으로 전환하고 특정 카테고리 선택
  const setPanelCategoryWithCategoryName = useCallback((categoryName: CategoryName) => {
    setActivePanel('category');
    // 여기서 categoryName을 활용해 추가 작업을 할 수 있습니다.
    // 예: setCategorySelection(categoryName);
  }, []);

  return {
    // 현재 선택된 탭
    activePanel,
    
    // 각 탭 선택 상태
    isRegionPanelActive: activePanel === 'region',
    isDatePanelActive: activePanel === 'date',
    isCategoryPanelActive: activePanel === 'category',
    isItineraryPanelActive: activePanel === 'itinerary',
    
    // 일정 관련 상태
    itineraryCreated,
    itineraryPanelDisplayed,
    selectedDay,
    
    // 액션 함수
    setActivePanel,
    openRegionPanel,
    openDatePanel,
    openCategoryPanel,
    openItineraryPanel,
    
    // 일정 액션 함수
    setItineraryCreated,
    setItineraryPanelDisplayed,
    setSelectedDay,
    
    // 일정 유틸리티 함수
    getDayPlaces,
    findDayByPlaceId,
    
    // 패널 유틸리티 함수
    setPanelCategoryWithCategoryName
  };
};
