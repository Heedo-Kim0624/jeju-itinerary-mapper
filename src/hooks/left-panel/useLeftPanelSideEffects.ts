import { useEffect, useState } from 'react';
import { ItineraryDay } from '@/hooks/use-itinerary';

interface UseLeftPanelSideEffectsProps {
  itinerary: ItineraryDay[] | null;
  selectedItineraryDay: number | null;
  showItinerary: boolean;
  setItinerary: (itinerary: ItineraryDay[]) => void;
  setSelectedItineraryDay: (day: number | null) => void;
  setShowItinerary: (show: boolean) => void;
  isGenerating?: boolean; // 추가
  setIsGenerating?: (generating: boolean) => void; // 추가
}

export const useLeftPanelSideEffects = ({
  itinerary,
  selectedItineraryDay,
  showItinerary,
  setItinerary,
  setSelectedItineraryDay,
  setShowItinerary,
  isGenerating, // 추가
  setIsGenerating, // 추가
}: UseLeftPanelSideEffectsProps) => {
  const [, setForceUpdate] = useState(0); // Moved up for use in forceRerenderListener

  // Listener for 'itineraryCreated' event
  useEffect(() => {
    const handleItineraryCreated = (event: Event) => {
      const customEvent = event as CustomEvent<{ itinerary: ItineraryDay[]; selectedDay: number | null }>;
      console.log("[useLeftPanelSideEffects] 'itineraryCreated' event received:", customEvent.detail);

      if (customEvent.detail.itinerary) {
        setItinerary(customEvent.detail.itinerary);
        setShowItinerary(true); 
        console.log("[useLeftPanelSideEffects] Setting showItinerary to true after receiving itinerary via event");
        
        // 로딩 상태 해제 (setIsGenerating이 제공된 경우)
        if (setIsGenerating) {
          setIsGenerating(false);
          console.log("[useLeftPanelSideEffects] Setting isGenerating to false after receiving itinerary from itineraryCreated event");
        }
      }

      if (customEvent.detail.selectedDay !== null) {
        setSelectedItineraryDay(customEvent.detail.selectedDay);
      } else if (customEvent.detail.itinerary && customEvent.detail.itinerary.length > 0) {
        setSelectedItineraryDay(customEvent.detail.itinerary[0].day);
      } else {
        setSelectedItineraryDay(null);
      }
      
      setTimeout(() => {
        console.log("[useLeftPanelSideEffects] Forcing UI update after state changes from itineraryCreated event");
        window.dispatchEvent(new Event('forceRerender')); // This will be caught by the other useEffect
      }, 200); // 약간 더 긴 지연 시간 설정
    };

    window.addEventListener('itineraryCreated', handleItineraryCreated);
    return () => window.removeEventListener('itineraryCreated', handleItineraryCreated);
  }, [setItinerary, setSelectedItineraryDay, setShowItinerary, setIsGenerating]); // setIsGenerating 추가

  // Effect to auto-show itinerary panel or select day based on state changes
  useEffect(() => {
    if (itinerary && itinerary.length > 0 && !showItinerary) {
      console.log("useLeftPanelSideEffects: Itinerary exists but panel not shown. Auto-activating itinerary panel.");
      setShowItinerary(true);
    }
    if (itinerary && itinerary.length > 0 && selectedItineraryDay === null) {
      console.log("useLeftPanelSideEffects: Itinerary exists but no day selected. Auto-selecting first itinerary day.");
      if (itinerary[0] && typeof itinerary[0].day === 'number') {
        setSelectedItineraryDay(itinerary[0].day);
      }
    }
  }, [itinerary, showItinerary, selectedItineraryDay, setShowItinerary, setSelectedItineraryDay]);

  // Listener for 'forceRerender'
  useEffect(() => {
    const forceRerenderListener = () => {
      console.log("[useLeftPanelSideEffects] 'forceRerender' event caught, updating dummy state for potential re-render.");
      
      // 로딩 상태 해제 (setIsGenerating이 제공된 경우)
      if (setIsGenerating) {
        setIsGenerating(false);
        console.log("[useLeftPanelSideEffects] Setting isGenerating to false after forceRerender event");
      }
      
      // 일정이 있지만 showItinerary가 false인 경우 자동으로 활성화
      // This logic might be redundant if itineraryCreated already handles setShowItinerary(true)
      // and forceRerender is dispatched after itineraryCreated.
      // However, keeping it as per user's prompt for robustness.
      if (itinerary && itinerary.length > 0 && !showItinerary) {
        setShowItinerary(true);
        console.log("[useLeftPanelSideEffects] Setting showItinerary to true after forceRerender event (and itinerary exists)");
      }
      
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('forceRerender', forceRerenderListener);
    return () => window.removeEventListener('forceRerender', forceRerenderListener);
  }, [itinerary, showItinerary, setShowItinerary, setIsGenerating]); // setIsGenerating 추가 + itinerary, showItinerary, setShowItinerary
};
