import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { ItineraryDay, ItineraryPlaceWithTime } from '@/types/core';

// 컨텍스트 타입 정의
interface ItineraryMapContextType {
  // 상태
  itinerary: ItineraryDay[] | null;
  selectedDay: number | null;
  currentDayPlaces: ItineraryPlaceWithTime[] | null;
  renderKey: number;
  
  // 액션
  setItinerary: (itinerary: ItineraryDay[] | null) => void;
  selectDay: (day: number) => void;
  
  // 유틸리티
  getCurrentDayData: () => ItineraryDay | null;
  getPlacesForDay: (day: number) => ItineraryPlaceWithTime[] | null;
}

// 기본값 생성
const defaultContextValue: ItineraryMapContextType = {
  itinerary: null,
  selectedDay: null,
  currentDayPlaces: null,
  renderKey: 0,
  setItinerary: () => {},
  selectDay: () => {},
  getCurrentDayData: () => null,
  getPlacesForDay: () => null
};

// 컨텍스트 생성
export const ItineraryMapContext = createContext<ItineraryMapContextType>(defaultContextValue);

// 컨텍스트 사용 훅
export const useItineraryMapContext = () => useContext(ItineraryMapContext);

// 컨텍스트 프로바이더 컴포넌트
export const ItineraryMapProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  // 상태 관리
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [renderKey, setRenderKey] = useState<number>(0);
  
  // 현재 일자의 장소 데이터 계산 (깊은 복사 적용)
  const currentDayPlaces = useMemo(() => {
    if (!itinerary || selectedDay === null) return null;
    const dayData = itinerary.find(day => day.day === selectedDay);
    if (!dayData || !dayData.places) return null;
    
    // 깊은 복사를 통해 참조 독립성 보장
    return JSON.parse(JSON.stringify(dayData.places));
  }, [itinerary, selectedDay]);
  
  // 일자 선택 함수
  const selectDay = useCallback((day: number) => {
    console.log(`[ItineraryMapProvider] 일자 ${day} 선택됨`);
    setSelectedDay(day);
    setRenderKey(prev => prev + 1); // 강제 리렌더링 트리거
  }, []);
  
  // 현재 일자 데이터 반환 함수
  const getCurrentDayData = useCallback(() => {
    if (!itinerary || selectedDay === null) return null;
    return itinerary.find(day => day.day === selectedDay) || null;
  }, [itinerary, selectedDay]);
  
  // 특정 일자의 장소 데이터 반환 함수 (깊은 복사 적용)
  const getPlacesForDay = useCallback((day: number) => {
    if (!itinerary) return null;
    const dayData = itinerary.find(d => d.day === day);
    if (!dayData || !dayData.places) return null;
    
    // 깊은 복사를 통해 참조 독립성 보장
    return JSON.parse(JSON.stringify(dayData.places));
  }, [itinerary]);
  
  // 컨텍스트 값
  const contextValue = useMemo(() => ({
    itinerary,
    setItinerary,
    selectedDay,
    currentDayPlaces,
    renderKey,
    selectDay,
    getCurrentDayData,
    getPlacesForDay
  }), [
    itinerary, 
    selectedDay, 
    currentDayPlaces, 
    renderKey, 
    selectDay, 
    getCurrentDayData, 
    getPlacesForDay
  ]);
  
  return (
    <ItineraryMapContext.Provider value={contextValue}>
      {children}
    </ItineraryMapContext.Provider>
  );
};
