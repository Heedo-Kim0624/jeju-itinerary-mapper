
import { useState } from 'react';
import { Place } from '@/types/supabase';
import { useItineraryCreator, ItineraryDay } from '../use-itinerary-creator';
import { toast } from 'sonner';
import { useCategoryResults } from '../use-category-results';

export const useItineraryActions = () => {
  const [itinerary, setItinerary] = useState<ItineraryDay[] | null>(null);
  const [selectedItineraryDay, setSelectedItineraryDay] = useState<number | null>(null);
  const [showItinerary, setShowItinerary] = useState<boolean>(false);
  const { createItinerary } = useItineraryCreator();
  
  // 각 카테고리별 전체 장소 데이터를 저장 (후보지 자동 추가에 사용)
  const [allAvailablePlaces, setAllAvailablePlaces] = useState<{[category: string]: Place[]}>({
    '관광지': [],
    '음식점': [],
    '카페': [],
    '숙소': []
  });
  
  // 카테고리별 장소 데이터 업데이트 함수
  const updateAvailablePlaces = (category: string, places: Place[]) => {
    setAllAvailablePlaces(prev => ({
      ...prev,
      [category]: places
    }));
    
    console.log(`${category} 카테고리 전체 장소 ${places.length}개 업데이트됨`);
  };

  const handleSelectItineraryDay = (day: number) => {
    console.log('일정 일자 선택:', day);
    setSelectedItineraryDay(day);
  };

  const generateItinerary = (
    placesToUse: Place[],
    startDate: Date,
    endDate: Date,
    startTime: string,
    endTime: string
  ) => {
    try {
      if (placesToUse.length === 0) {
        toast.error("선택된 장소가 없습니다.");
        return null;
      }
    
      console.log('일정 생성 시작', {
        장소수: placesToUse.length,
        시작일: startDate,
        종료일: endDate,
        시작시간: startTime,
        종료시간: endTime
      });
      
      const generatedItinerary = createItinerary(
        placesToUse,
        startDate,
        endDate,
        startTime,
        endTime
      );
      
      if (generatedItinerary.length === 0) {
        toast.error("일정을 생성할 수 없습니다. 더 많은 장소를 선택해주세요.");
        return null;
      }
      
      setItinerary(generatedItinerary);
      setSelectedItineraryDay(1); // 항상 첫 번째 일차를 기본으로 선택
      setShowItinerary(true);
      
      console.log("일정 생성 완료:", {
        일수: generatedItinerary.length,
        총장소수: generatedItinerary.reduce((sum, day) => sum + day.places.length, 0),
        첫날장소: generatedItinerary[0]?.places.map(p => p.name).join(', ')
      });
      
      return generatedItinerary;
    } catch (error) {
      console.error("일정 생성 오류:", error);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 경로 생성 핸들러
  const handleCreateItinerary = (
    selectedPlaces: Place[], 
    dates: {
      startDate: Date;
      endDate: Date;
      startTime: string;
      endTime: string;
    } | null,
    preparePayload: (
      places: Place[], 
      dateTime: { start_datetime: string; end_datetime: string } | null,
      allAvailablePlaces: { [category: string]: Place[] }
    ) => any
  ) => {
    if (!dates) {
      console.error('경로 생성 실패: 날짜 정보가 없습니다.');
      toast.error("여행 날짜를 설정해주세요!");
      return null;
    }
    
    if (selectedPlaces.length === 0) {
      console.error('경로 생성 실패: 선택된 장소가 없습니다.');
      toast.error("장소를 먼저 선택해주세요!");
      return null;
    }
    
    console.log("경로 생성 시작:", {
      장소수: selectedPlaces.length,
      날짜: dates,
      전체_가용_장소: {
        관광지: allAvailablePlaces['관광지']?.length || 0,
        음식점: allAvailablePlaces['음식점']?.length || 0,
        카페: allAvailablePlaces['카페']?.length || 0,
        숙소: allAvailablePlaces['숙소']?.length || 0
      }
    });
    
    // 전체 장소 데이터를 preparePayload 함수에 전달하여 후보지 자동 생성 지원
    const payload = preparePayload(
      selectedPlaces, 
      {
        start_datetime: dates.startDate.toISOString(),
        end_datetime: dates.endDate.toISOString()
      },
      allAvailablePlaces
    );
    
    console.log('생성된 페이로드:', payload);
    
    const result = generateItinerary(
      selectedPlaces,
      dates.startDate,
      dates.endDate,
      dates.startTime,
      dates.endTime
    );
    
    if (result) {
      toast.success("일정이 성공적으로 생성되었습니다!");
      setShowItinerary(true); // 명시적으로 일정 패널을 표시하도록 설정
    }
    
    return result;
  };

  return {
    itinerary,
    selectedItineraryDay,
    showItinerary,
    allAvailablePlaces,
    updateAvailablePlaces,
    setItinerary,
    setSelectedItineraryDay,
    setShowItinerary,
    handleSelectItineraryDay,
    handleCreateItinerary
  };
};
