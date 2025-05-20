
import { useCallback } from 'react';
import { Place } from '@/types';
import { toast } from 'sonner';
import { CategoryName } from '@/utils/categoryUtils';

interface LeftPanelCallbacksProps {
  handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void;
  handlePanelBack: (category: string) => void;
  handleCloseItinerary: () => void;
  handleCreateItinerary: () => Promise<boolean>;
  setRegionSlidePanelOpen: (open: boolean) => void;
  selectedRegions: string[];
  setRegionConfirmed: (confirmed: boolean) => void;
}

/**
 * Custom hook to manage callback functions for the LeftPanel
 */
export const useLeftPanelCallbacks = ({
  handleConfirmCategory,
  handlePanelBack,
  handleCloseItinerary,
  handleCreateItinerary,
  setRegionSlidePanelOpen,
  selectedRegions,
  setRegionConfirmed,
}: LeftPanelCallbacksProps) => {
  // Handler for closing panel with back button
  const handleClosePanelWithBackButton = useCallback(() => {
    console.log("[LeftPanel] '뒤로' 버튼으로 패널 닫기 실행");
    handleCloseItinerary();
  }, [handleCloseItinerary]);

  // Handler for category panel back button
  const handlePanelBackByCategory = useCallback((category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    handlePanelBack(category);
  }, [handlePanelBack]);

  // Handler for category keyword selection confirmation
  const handleConfirmCategoryKeywordSelection = useCallback((category: CategoryName, finalKeywords: string[]) => {
    console.log(`[LeftPanel] 카테고리 '${category}' 키워드 확인: ${finalKeywords.join(', ')}`);
    // The true flag in handleConfirmCategory ensures setShowCategoryResult is called
    handleConfirmCategory(category, finalKeywords, true);
    return true; // For compatibility if used in an event handler expecting a boolean
  }, [handleConfirmCategory]);
  
  // Handler for initiating itinerary creation with loading state
  const handleCreateItineraryWithLoading = useCallback(() => {
    console.log("[LeftPanel] 일정 생성 시작 (Hook call)");
    
    handleCreateItinerary()
      .then(success => {
        if (success) {
          console.log("[LeftPanel] handleCreateItinerary Promise 성공. 이벤트 및 hook state 변경 대기 중...");
        } else {
          console.log("[LeftPanel] handleCreateItinerary Promise 실패.");
        }
      })
      .catch(error => {
        console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error);
      });

    return true; // For compatibility or to signal successful initiation
  }, [handleCreateItinerary]);

  // Handler for region panel confirmation
  const handleRegionConfirm = useCallback(() => {
    setRegionSlidePanelOpen(false);
    if (selectedRegions.length > 0) {
      setRegionConfirmed(true);
    } else {
      toast.info('지역을 선택해주세요.');
    }
  }, [selectedRegions, setRegionSlidePanelOpen, setRegionConfirmed]);

  return {
    handleClosePanelWithBackButton,
    handlePanelBackByCategory,
    handleConfirmCategoryKeywordSelection,
    handleCreateItineraryWithLoading,
    handleRegionConfirm
  };
};
