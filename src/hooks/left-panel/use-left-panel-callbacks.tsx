
import { useCallback } from 'react';
import { toast } from 'sonner';
import { CategoryName, CATEGORY_MAPPING_KO_TO_EN } from '@/utils/categoryUtils'; // CATEGORY_MAPPING_KO_TO_EN 추가

interface LeftPanelCallbacksProps {
  handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void;
  handlePanelBack: (category: string) => void;
  handleCloseItinerary: () => void;
  handleCreateItinerary?: () => Promise<void>; // 선택적으로 변경
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

  // General handler for category panel back button (kept for other potential uses)
  const handlePanelBackByCategory = useCallback((category: string) => {
    console.log(`${category} 카테고리 패널 뒤로가기`);
    handlePanelBack(category);
  }, [handlePanelBack]);

  // General handler for category keyword selection confirmation (kept for other potential uses)
  const handleConfirmCategoryKeywordSelection = useCallback((category: CategoryName, finalKeywords: string[]) => {
    console.log(`[LeftPanel] 카테고리 '${category}' 키워드 확인: ${finalKeywords.join(', ')}`);
    handleConfirmCategory(category, finalKeywords, true);
    return true; 
  }, [handleConfirmCategory]);
  
  const onConfirmCategoryCallbacks = {
    accomodation: (finalKeywords: string[]) => handleConfirmCategory('숙소', finalKeywords, true),
    landmark: (finalKeywords: string[]) => handleConfirmCategory('관광지', finalKeywords, true),
    restaurant: (finalKeywords: string[]) => handleConfirmCategory('음식점', finalKeywords, true),
    cafe: (finalKeywords: string[]) => handleConfirmCategory('카페', finalKeywords, true),
  };

  const handlePanelBackCallbacks = {
    accomodation: () => handlePanelBack('숙소'),
    landmark: () => handlePanelBack('관광지'),
    restaurant: () => handlePanelBack('음식점'),
    cafe: () => handlePanelBack('카페'),
  };

  // Handler for initiating itinerary creation with loading state
  const handleCreateItineraryWithLoading = useCallback(() => {
    console.log("[LeftPanel] 일정 생성 시작 (Hook call)");
    
    if (handleCreateItinerary) {
      handleCreateItinerary()
        .then(() => {
          console.log("[LeftPanel] handleCreateItinerary Promise 성공. 이벤트 및 hook state 변경 대기 중...");
        })
        .catch(error => {
          console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error);
        });
    } else {
      console.warn("[LeftPanel] handleCreateItinerary 함수가 제공되지 않았습니다.");
    }

    return true; 
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
    handlePanelBackByCategory, // Still available if needed elsewhere directly
    handleConfirmCategoryKeywordSelection, // Still available if needed elsewhere directly
    handleCreateItineraryWithLoading,
    handleRegionConfirm,
    onConfirmCategoryCallbacks, // Added for LeftPanelProps
    handlePanelBackCallbacks,   // Added for LeftPanelProps
  };
};
