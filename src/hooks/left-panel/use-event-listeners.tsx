
import { useEffect } from 'react';
import { toast } from 'sonner';

/**
 * Sets up event listeners for the left panel
 */
export const useEventListeners = (
  setIsGenerating: (isGenerating: boolean) => void,
  setItineraryReceived: (received: boolean) => void
) => {
  // Set up event listeners for force rerender and itinerary created events
  useEffect(() => {
    const handleForceRerender = () => {
      console.log("[useEventListeners] forceRerender 이벤트 수신. 로딩 상태 해제 시도.");
      setIsGenerating(false);
    };
    
    const handleItineraryCreated = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      console.log("[useEventListeners] itineraryCreated 이벤트 수신", detail);
      
      setItineraryReceived(true);
      setIsGenerating(false);
      
      if (detail && detail.itinerary) {
        if (detail.itinerary.length > 0) {
          console.log("[useEventListeners] itineraryCreated: 유효한 일정 데이터 확인됨.");
        } else {
          console.warn("[useEventListeners] itineraryCreated: 일정이 비어있습니다.");
          toast.info("생성된 일정이 없습니다. 다른 장소를 선택하거나 조건을 변경해보세요.");
        }
      } else {
        console.error("[useEventListeners] itineraryCreated 이벤트에 itinerary 데이터가 없습니다.");
        toast.error("일정 데이터를 받는데 실패했습니다.");
      }
    };
    
    window.addEventListener('forceRerender', handleForceRerender);
    window.addEventListener('itineraryCreated', handleItineraryCreated);
    
    return () => {
      window.removeEventListener('forceRerender', handleForceRerender);
      window.removeEventListener('itineraryCreated', handleItineraryCreated);
    };
  }, [setIsGenerating, setItineraryReceived]);

  // Force rerender effect
  useEffect(() => {
    const forceRerenderListener = () => {
      console.log("[useEventListeners] 'forceRerender' event caught, updating dummy state.");
      // The original implementation used a dummy state update, but we don't need it here
      // since we're directly handling the event for loading state management
    };
    window.addEventListener('forceRerender', forceRerenderListener);
    return () => {
      window.removeEventListener('forceRerender', forceRerenderListener);
    };
  }, []);
};
