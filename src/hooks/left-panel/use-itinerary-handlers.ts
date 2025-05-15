
import { TripDetails } from '@/hooks/use-trip-details';
import { Place, SchedulePayload } from '@/types/supabase';
import { ItineraryDay } from '@/types/supabase'; // ItineraryDay 임포트
import { toast } from 'sonner';

// setCurrentPanel 타입을 React.Dispatch<React.SetStateAction<string>>와 유사하게 변경
type SetCurrentPanelType = React.Dispatch<React.SetStateAction<'region' | 'date' | 'category' | 'itinerary'>>;


export const useItineraryHandlers = () => {
  const handleCreateItinerary = async (
    tripDetails: TripDetails,
    selectedPlaces: Place[],
    prepareSchedulePayload: (
      placesToSchedule: Place[],
      dateTime: { start_datetime: string; end_datetime: string } | null,
      // 이 부분은 모든 카테고리의 추천 장소 목록을 받아야 함
      availableRecommendedPlacesByCategory: { [category: string]: Place[] } 
    ) => SchedulePayload | null,
    // 이 부분은 모든 카테고리의 추천 장소를 포함해야 함
    recommendedPlaces: Place[], // 현재는 단일 카테고리 추천 장소만 넘어옴
    generateItinerary: (payload: SchedulePayload) => Promise<ItineraryDay[] | null>,
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: SetCurrentPanelType
  ) => {
    console.log('[일정 생성] 시작', {
      여행정보: tripDetails.dates,
      선택장소수: selectedPlaces.length,
      추천장소수: recommendedPlaces.length, // 실제로 모든 카테고리 추천 장소가 필요
    });

    if (!tripDetails.dates) {
      toast.error('여행 날짜와 시간을 선택해주세요.');
      return false;
    }

    const { startDate, endDate, startTime, endTime } = tripDetails.dates;
    if (!startDate || !endDate || !startTime || !endTime) {
      toast.error('정확한 여행 날짜와 시간을 설정해주세요.');
      return false;
    }

    const startDateTimeStr = `${startDate.toISOString().split('T')[0]}T${startTime}:00`;
    const endDateTimeStr = `${endDate.toISOString().split('T')[0]}T${endTime}:00`;
    
    // TODO: availableRecommendedPlacesByCategory를 모든 카테고리에서 제대로 수집해야 합니다.
    // 현재는 recommendedPlaces (단일 활성 카테고리)만 사용하고 있어 자동완성에 한계가 있습니다.
    // 임시로, recommendedPlaces를 카테고리별로 분류하여 전달 시도
    const allRecommendedByCategory: { [category: string]: Place[] } = {};
    recommendedPlaces.forEach(p => {
      const categoryKey = p.category || '기타'; // 실제 카테고리 필드 사용
      if (!allRecommendedByCategory[categoryKey]) {
        allRecommendedByCategory[categoryKey] = [];
      }
      allRecommendedByCategory[categoryKey].push(p);
    });
    
    // selectedPlaces도 카테고리별로 분류하여 전달
    selectedPlaces.forEach(p => {
        const categoryKey = p.category || '기타'; // 실제 카테고리 필드 사용
        // 선택된 장소는 추천 목록에 이미 있을 수 있으므로, 중복 추가하지 않도록 합니다.
        // 여기서는 prepareSchedulePayload가 이 처리를 할 것으로 기대합니다.
    });


    const payload = prepareSchedulePayload(
      selectedPlaces,
      { start_datetime: startDateTimeStr, end_datetime: endDateTimeStr },
      allRecommendedByCategory // 수정된 부분: 모든 카테고리의 추천 장소를 전달해야 함
    );

    if (!payload) {
      console.error('[일정 생성] 페이로드 생성 실패');
      return false;
    }

    try {
      const itineraryData = await generateItinerary(payload);
      if (itineraryData && itineraryData.length > 0) {
        toast.success('여행 일정이 성공적으로 생성되었습니다!');
        setShowItinerary(true);
        setCurrentPanel('itinerary');
        console.log('[일정 생성] 성공:', itineraryData);
        return true;
      } else {
        toast.error('일정 생성에 실패했거나 반환된 일정이 없습니다.');
        console.error('[일정 생성] 실패 또는 빈 일정 반환');
        return false;
      }
    } catch (error) {
      toast.error(`일정 생성 중 오류 발생: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      console.error('[일정 생성] API 요청 오류:', error);
      return false;
    }
  };

  const handleCloseItinerary = (
    setShowItinerary: (show: boolean) => void,
    setCurrentPanel: SetCurrentPanelType
  ) => {
    setShowItinerary(false);
    setCurrentPanel('category'); // 또는 다른 기본 패널
    toast.info('일정 보기를 닫았습니다.');
  };

  return {
    handleCreateItinerary,
    handleCloseItinerary,
  };
};
