
import { useCallback } from 'react';
import { toast } from 'sonner';
// Removed unused CategoryName and CATEGORY_MAPPING_KO_TO_EN
// import { CategoryName } from '@/utils/categoryUtils';

interface LeftPanelCallbacksProps {
  handleConfirmCategory: (category: string, finalKeywords: string[], clearSelection: boolean) => void;
  handlePanelBack: (category: string) => void;
  handleCloseItinerary: () => void;
  handleCreateItinerary?: () => Promise<any | null>;
  setRegionSlidePanelOpen: (open: boolean) => void;
  selectedRegions: string[];
  setRegionConfirmed: (confirmed: boolean) => void;
}

export const useLeftPanelCallbacks = ({
  handleConfirmCategory,
  handlePanelBack,
  handleCloseItinerary,
  handleCreateItinerary,
  setRegionSlidePanelOpen,
  selectedRegions,
  setRegionConfirmed,
}: LeftPanelCallbacksProps) => {
  const handleClosePanelWithBackButton = useCallback(() => {
    // console.log("[LeftPanel] '뒤로' 버튼으로 패널 닫기 실행"); // Debug log removed
    handleCloseItinerary();
  }, [handleCloseItinerary]);

  // Removed handlePanelBackByCategory as handlePanelBackCallbacks is used

  // Removed handleConfirmCategoryKeywordSelection as onConfirmCategoryCallbacks is used

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

  const handleCreateItineraryWithLoading = useCallback(() => {
    // console.log("[LeftPanel] 일정 생성 시작 (Hook call)"); // Debug log removed
    
    if (handleCreateItinerary) {
      handleCreateItinerary()
        .then((result) => {
          // console.log("[LeftPanel] handleCreateItinerary Promise 성공. 이벤트 및 hook state 변경 대기 중...", result); // Debug log removed
        })
        .catch(error => {
          console.error("[LeftPanel] 일정 생성 중 오류 (handleCreateItineraryWithLoading의 catch):", error); // Kept error log
        });
    } else {
      // console.warn("[LeftPanel] handleCreateItinerary 함수가 제공되지 않았습니다."); // Debug log removed
      toast.warn("[LeftPanel] handleCreateItinerary 함수가 제공되지 않았습니다."); // Replaced with toast for user visibility if needed
    }

    return true;
  }, [handleCreateItinerary]);

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
    // handlePanelBackByCategory, // Removed export
    // handleConfirmCategoryKeywordSelection, // Removed export
    handleCreateItineraryWithLoading,
    handleRegionConfirm,
    onConfirmCategoryCallbacks,
    handlePanelBackCallbacks,
  };
};
