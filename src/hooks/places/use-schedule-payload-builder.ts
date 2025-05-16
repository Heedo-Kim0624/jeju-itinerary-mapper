
import { SelectedPlace, SchedulePlace, SchedulePayload as LocalSchedulePayload } from '@/types/supabase';
import { toast } from 'sonner';

interface UseSchedulePayloadBuilderProps {
  // No props needed for the hook itself, but for the returned function
}

export const useSchedulePayloadBuilder = (/* props: UseSchedulePayloadBuilderProps */) => {
  const prepareSchedulePayload = (
    userSelectedPlacesInput: SelectedPlace[], 
    candidatePlacesInput: SelectedPlace[], // Explicitly pass candidatePlaces
    startDatetimeISO: string | null, 
    endDatetimeISO: string | null
  ): LocalSchedulePayload | null => {
    
    if (!startDatetimeISO || !endDatetimeISO) {
      toast.error("날짜 및 시간을 먼저 선택해주세요.");
      return null;
    }
    
    const directlySelectedPlaces = userSelectedPlacesInput.filter(p => !p.isCandidate);

    const selectedPlacesForPayload: SchedulePlace[] = directlySelectedPlaces.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, // Ensure ID is number if possible
      name: p.name || 'Unknown Place'
    }));
    
    const candidatePlacesForPayload: SchedulePlace[] = candidatePlacesInput.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id, // Ensure ID is number if possible
      name: p.name || 'Unknown Place'
    }));
        
    const payload: LocalSchedulePayload = {
      selected_places: selectedPlacesForPayload,
      candidate_places: candidatePlacesForPayload,
      start_datetime: startDatetimeISO,
      end_datetime: endDatetimeISO
    };

    console.log("[일정 생성] 최종 Payload 준비 (useSchedulePayloadBuilder):", JSON.stringify(payload, null, 2));
    return payload;
  };

  return { prepareSchedulePayload };
};
