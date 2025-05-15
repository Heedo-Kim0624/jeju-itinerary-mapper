
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase'; 
import { toast } from 'sonner';
import { useAutoComplete } from './use-auto-complete';
import { CategoryName, getCategoryKorean } from '@/utils/categoryUtils';

/**
 * Hook for preparing schedule payload for API requests
 */
export const useSchedulePayload = () => {
  const { autoCompleteWithCandidates } = useAutoComplete();

  /**
   * Prepares schedule payload for API request, auto-completing with recommended places if needed
   */
  const prepareSchedulePayload = (
    placesToSchedule: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null,
    availableRecommendedPlacesByCategory: Record<CategoryName, Place[]> = {} 
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    const startDate = new Date(dateTime.start_datetime);
    const endDate = new Date(dateTime.end_datetime);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    console.log("[일정 생성] 일정 생성 전 장소 자동 보완 시작", {
      선택된_장소_수: placesToSchedule.length, 
      여행_일수: tripDays
    });
    
    // autoCompleteWithCandidates expects KOREAN category names as keys
    const enrichedPlaces = autoCompleteWithCandidates(placesToSchedule, availableRecommendedPlacesByCategory, tripDays);

    const userSelected: SelectedPlace[] = enrichedPlaces
      .filter(p => !p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    const autoCandidates: SelectedPlace[] = enrichedPlaces
      .filter(p => p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    console.log('[일정 생성] 일정 생성 데이터 (prepareSchedulePayload):', {
      사용자선택_장소수: userSelected.length,
      자동후보_장소수: autoCandidates.length,
      총_장소수: enrichedPlaces.length,
      날짜: dateTime,
      payload_selected: userSelected.map(p => p.name),
      payload_candidates: autoCandidates.map(p => p.name),
    });

    // 서버 요청 페이로드 디버깅 로그
    const payload = {
      selected_places: userSelected,
      candidate_places: autoCandidates,
      ...dateTime
    };
    
    console.log("[일정 생성] 서버 요청 페이로드:", JSON.stringify(payload, null, 2));

    return payload;
  };

  return {
    prepareSchedulePayload
  };
};
