
import { useEffect } from 'react';
import { useCategorySelection } from '@/hooks/use-category-selection';
import { usePlaces } from '@/hooks/use-places';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { useState } from 'react';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';

interface CategoryResultHandlerProps {
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: any, checked: boolean, category: string) => void;
  selectedPlaces: any[];
  showCategoryResult: boolean;
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces,
  showCategoryResult,
}) => {
  const { activeMiddlePanelCategory, handlePanelBack } = useCategorySelection();
  const { handleSelectPlace, isPlaceSelected, categoryPlacesList, updateRecommendedPlaceList } = usePlaces();
  const { clearMarkersAndUiElements } = useMapContext();
  const [isInternalPanelOpen, setIsInternalPanelOpen] = useState(false);

  // 패널 닫기 처리
  const handleClosePanel = () => {
    clearMarkersAndUiElements();
    handlePanelBack();
    onClose();
  };

  // 카테고리 패널 열림 상태 감시 및 처리
  useEffect(() => {
    if (activeMiddlePanelCategory && showCategoryResult) {
      setIsInternalPanelOpen(true);
    } else {
      setIsInternalPanelOpen(false);
    }
  }, [activeMiddlePanelCategory, showCategoryResult]);

  if (!activeMiddlePanelCategory || !showCategoryResult || !isInternalPanelOpen) {
    return null;
  }

  // 현재 활성화된 카테고리에 대한 장소 및 키워드 데이터 가져오기
  const currentPlaces = categoryPlacesList[activeMiddlePanelCategory];
  const currentRegions = 
    currentPlaces && currentPlaces.regions ? currentPlaces.regions : [];
  const currentKeywords = 
    currentPlaces && currentPlaces.keywords ? currentPlaces.keywords : [];

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
      onSelectPlace={(place, checked) => handleSelectPlace(place, checked, activeMiddlePanelCategory)}
      isPlaceSelected={isPlaceSelected}
      isOpen={isInternalPanelOpen}
      updateRecommendedPlaceList={updateRecommendedPlaceList}
    />
  );
};

export default CategoryResultHandler;
