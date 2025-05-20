
import { useCallback } from 'react';
import { toast } from 'sonner';
import type { Place } from '@/types';

/**
 * Manages the logic for creating itineraries and handling itinerary-related events
 */
export const useItineraryCreation = (
  tripDetails: any,
  selectedPlaces: Place[],
  prepareSchedulePayload: (places: Place[], startISO: string | null, endISO: string | null) => any,
  generateItinerary: (places: Place[], startDate: Date | null, endDate: Date | null, startTime: string, endTime: string) => any,
  setShowItinerary: (show: boolean) => void,
  setCurrentPanel: (panel: 'region' | 'date' | 'category' | 'itinerary') => void,
  setIsGenerating: (isGenerating: boolean) => void,
  setItineraryReceived: (received: boolean) => void
) => {
  /**
   * Initiates the itinerary creation process
   * Will try server-side first, then fall back to client-side if needed
   */
  const handleInitiateItineraryCreation = useCallback(async () => {
    console.log('[useItineraryCreation] handleInitiateItineraryCreation called');
    
    // Ensure tripDetails and selectedPlaces are valid before calling
    if (!tripDetails.dates || !tripDetails.startDatetime || !tripDetails.endDatetime) {
      toast.error("여행 날짜와 시간을 먼저 설정해주세요.");
      return false;
    }
    if (selectedPlaces.length === 0) {
      toast.error("선택된 장소가 없습니다. 장소를 선택해주세요.");
      return false;
    }

    // Call the server-side itinerary creation logic
    // This function now primarily calls the server. Client fallback is inside it.
    const success = await handleCreateItinerary();
    
    if (success) {
      console.log('[useItineraryCreation] Itinerary creation process initiated (server or client). Waiting for itineraryCreated event.');
      // No direct setShowItinerary(true) here; let the event handler in useItinerary do it.
    } else {
      console.log('[useItineraryCreation] Itinerary creation process failed to initiate or complete.');
      // Ensure loading states are properly reset if failure happens early.
    }
    
    return success;
  }, [
    tripDetails, 
    selectedPlaces,
    setShowItinerary, 
    setCurrentPanel
  ]);
  
  /**
   * Handles the actual itinerary creation by calling the appropriate service
   */
  const handleCreateItinerary = useCallback(async () => {
    setItineraryReceived(false);
    setIsGenerating(true);
    
    try {
      // Call server-side itinerary generation service (implemented in useItineraryHandlers)
      const itineraryHandlersCreateItinerary = async () => {
        try {
          console.log('[useItineraryCreation] Preparing schedule payload');
          const payload = prepareSchedulePayload(
            selectedPlaces,
            tripDetails.startDatetime,
            tripDetails.endDatetime
          );
          
          if (!payload) {
            console.error('[useItineraryCreation] Failed to prepare schedule payload');
            return null;
          }
          
          console.log('[useItineraryCreation] Schedule payload prepared:', payload);
          
          // Normally there would be a server API call here
          // For fallback/demo, use client-side generation
          const clientItinerary = generateItinerary(
            selectedPlaces,
            tripDetails.dates?.startDate || null,
            tripDetails.dates?.endDate || null,
            tripDetails.dates?.startTime || "10:00",
            tripDetails.dates?.endTime || "22:00"
          );
          
          if (clientItinerary) {
            // Dispatch itinerary created event
            const event = new CustomEvent('itineraryCreated', {
              detail: { itinerary: clientItinerary }
            });
            window.dispatchEvent(event);
            return true;
          }
          
          return false;
        } catch (error) {
          console.error('[useItineraryCreation] Error creating itinerary:', error);
          return false;
        }
      };
      
      const success = await itineraryHandlersCreateItinerary();
      
      if (!success) {
        setIsGenerating(false);
        setItineraryReceived(false);
        toast.error("일정 생성에 실패했습니다.");
      }
      
      return success;
    } catch (error) {
      console.error('[useItineraryCreation] Error in handleCreateItinerary:', error);
      setIsGenerating(false);
      setItineraryReceived(false);
      toast.error("일정 생성 중 오류가 발생했습니다.");
      return false;
    }
  }, [
    tripDetails,
    selectedPlaces,
    prepareSchedulePayload,
    generateItinerary,
    setIsGenerating,
    setItineraryReceived
  ]);
  
  /**
   * Closes the itinerary panel and resets related states
   */
  const handleCloseItineraryPanel = useCallback(() => {
    setShowItinerary(false);
    setCurrentPanel('category');
  }, [setShowItinerary, setCurrentPanel]);

  return {
    handleInitiateItineraryCreation,
    handleCloseItineraryPanel
  };
};
