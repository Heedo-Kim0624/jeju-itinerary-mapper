
import { useCallback } from 'react';
import { toast } from 'sonner';
import { Place, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';

/**
 * 일정 관련 핸들러 훅
 */
export const useItineraryHandlers = () => {
  const { clearMarkersAndUiElements } = useMapContext();

  // 일정 생성 핸들러
  const handleCreateItinerary = useCallback(async (
    tripDetails: any,
    selectedPlaces: Place[],
    prepareSchedulePayload: (places: Place[], dateTime: any, recommendedPlaces: any) => SchedulePayload | null,
    recommendedPlaces: Place[],
    generateItinerary: any,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ) => {
    if (!tripDetails.dates) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    // 추천 장소를 카테고리별로 그룹화
    const engToKorCategory = (engCategory?: string): string => {
      if (!engCategory) return '기타';
      switch (engCategory.toLowerCase()) {
        case 'accommodation': return '숙소';
        case 'attraction': return '관광지';
        case 'restaurant': return '음식점';
        case 'cafe': return '카페';
        default: return '기타';
      }
    };
    
    const recommendedPlacesGroupedByCategory: Record<string, Place[]> = {};
    if (recommendedPlaces) {
      recommendedPlaces.forEach(place => {
        const koreanCategoryKey = engToKorCategory(place.category);
        if (!recommendedPlacesGroupedByCategory[koreanCategoryKey]) {
          recommendedPlacesGroupedByCategory[koreanCategoryKey] = [];
        }
        recommendedPlacesGroupedByCategory[koreanCategoryKey].push(place);
      });
    }
    
    console.log("추천 장소 (카테고리별 그룹화):", recommendedPlacesGroupedByCategory);

    const dateTimeInfo = tripDetails.dates ? {
      start_datetime: new Date(tripDetails.dates.startDate.setHours(
        parseInt(tripDetails.dates.startTime.split(':')[0]), 
        parseInt(tripDetails.dates.startTime.split(':')[1])
      )).toISOString(),
      end_datetime: new Date(tripDetails.dates.endDate.setHours(
        parseInt(tripDetails.dates.endTime.split(':')[0]), 
        parseInt(tripDetails.dates.endTime.split(':')[1])
      )).toISOString(),
    } : null;

    // 경로 생성 페이로드 준비
    const payload = prepareSchedulePayload(selectedPlaces, dateTimeInfo, recommendedPlacesGroupedByCategory);

    if (payload) {
      console.log("경로 생성 버튼 클릭됨, 경로 생성 함수 호출");
      const result = generateItinerary(
        selectedPlaces, 
        tripDetails.dates.startDate, 
        tripDetails.dates.endDate, 
        tripDetails.dates.startTime, 
        tripDetails.dates.endTime
      );
      
      if (result) {
        setShowItinerary(true);
        setCurrentPanel('itinerary');
      }
      
      return !!result;
    } else {
      console.error("일정 생성에 필요한 정보가 부족합니다.");
      return false;
    }
  }, []);

  // 일정 닫기 핸들러
  const handleCloseItinerary = useCallback((
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: (panel: string) => void
  ) => {
    setShowItinerary(false);
    clearMarkersAndUiElements(); // 지도 마커와 경로 제거
    setCurrentPanel('category'); // 또는 마지막 관련 패널로
  }, [clearMarkersAndUiElements]);

  return {
    handleCreateItinerary,
    handleCloseItinerary
  };
};
