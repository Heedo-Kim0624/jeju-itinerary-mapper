
import { useEffect } from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { usePlaces } from '@/hooks/use-places';
import { useMapContext } from '@/components/rightpanel/MapContext';

// 실제 파일 경로는 다를 수 있으니 확인 필요
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';

interface CategoryResultHandlerProps {
  isCategoryResultPanelOpen: boolean;
  setIsCategoryResultPanelOpen: (isOpen: boolean) => void;
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  isCategoryResultPanelOpen,
  setIsCategoryResultPanelOpen,
}) => {
  const { activeMiddlePanelCategory, handlePanelBack } = useCategorySelection();
  const { handleSelectPlace, isPlaceSelected, categoryPlacesList, updateRecommendedPlaceList } = usePlaces();
  const { clearMarkersAndUiElements } = useMapContext();

  // 패널 닫기 처리
  const handleClosePanel = () => {
    clearMarkersAndUiElements();
    handlePanelBack();
    setIsCategoryResultPanelOpen(false);
  };

  // 카테고리 패널 열림 상태 감시 및 처리
  useEffect(() => {
    if (activeMiddlePanelCategory) {
      setIsCategoryResultPanelOpen(true);
    } else {
      setIsCategoryResultPanelOpen(false);
    }
  }, [activeMiddlePanelCategory, setIsCategoryResultPanelOpen]);

  if (!activeMiddlePanelCategory || !isCategoryResultPanelOpen) {
    return null;
  }

  // 현재 활성화된 카테고리에 대한 장소 및 키워드 데이터 가져오기
  const currentPlaces = categoryPlacesList[activeMiddlePanelCategory] || [];
  const currentRegions = 
    currentPlaces.regions && Array.isArray(currentPlaces.regions) 
      ? currentPlaces.regions 
      : [];
  const currentKeywords = 
    currentPlaces.keywords && Array.isArray(currentPlaces.keywords) 
      ? currentPlaces.keywords 
      : [];

  // 카테고리를 한글로 변환
  const categoryMap: Record<string, '숙소' | '관광지' | '음식점' | '카페'> = {
    accommodation: '숙소',
    landmark: '관광지',
    restaurant: '음식점',
    cafe: '카페',
  };

  const category = categoryMap[activeMiddlePanelCategory];

  return (
    <CategoryResultPanel
      category={category}
      regions={currentRegions}
      keywords={currentKeywords}
      onClose={handleClosePanel}
      onSelectPlace={(place, checked) => handleSelectPlace(place, checked, category)}
      isPlaceSelected={isPlaceSelected}
      isOpen={isCategoryResultPanelOpen}
      updateRecommendedPlaceList={updateRecommendedPlaceList}
    />
  );
};

export default CategoryResultHandler;
