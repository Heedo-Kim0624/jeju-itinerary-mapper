
import React from 'react';
import { Place } from '@/types/supabase';
import CategoryResultPanel from '../middlepanel/CategoryResultPanel';
import { useSelectedPlaces } from '@/hooks/use-selected-places';

interface CategoryResultHandlerProps {
  showCategoryResult: boolean;
  selectedRegions: string[];
  selectedKeywordsByCategory: Record<string, string[]>;
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: string) => void;
  selectedPlaces: Place[];
}

const CategoryResultHandler: React.FC<CategoryResultHandlerProps> = ({
  showCategoryResult,
  selectedRegions,
  selectedKeywordsByCategory,
  onClose,
  onSelectPlace,
  selectedPlaces,
}) => {
  // Import handleConfirmPlaceSelection from useSelectedPlaces hook
  const { handleConfirmPlaceSelection } = useSelectedPlaces();

  // 활성화된 카테고리 결정
  const activeCategory = showCategoryResult ? Object.keys(selectedKeywordsByCategory)[0] : null;
  
  // 활성화된 카테고리에 대한 키워드
  const activeKeywords = activeCategory ? selectedKeywordsByCategory[activeCategory] || [] : [];
  
  // 선택된 장소인지 확인하는 함수
  const isPlaceSelected = (id: string | number): boolean => {
    return selectedPlaces.some(place => place.id === id);
  };

  // 장소 선택 처리 함수
  const handleSelectPlace = (place: Place, checked: boolean) => {
    if (activeCategory) {
      onSelectPlace(place, checked, activeCategory);
    }
  };

  // 패널이 닫힐 때의 핸들러 - 직접적으로 onClose 호출
  const handleClose = () => {
    onClose();
  };

  if (!showCategoryResult || !activeCategory) return null;

  // 활성 카테고리를 한글 카테고리명으로 변환
  let categoryInKorean: '숙소' | '관광지' | '음식점' | '카페';
  
  switch (activeCategory.toLowerCase()) {
    case 'accommodation':
      categoryInKorean = '숙소';
      break;
    case 'landmark':
      categoryInKorean = '관광지';
      break;
    case 'restaurant':
      categoryInKorean = '음식점';
      break;
    case 'cafe':
      categoryInKorean = '카페';
      break;
    default:
      categoryInKorean = '관광지'; // Default fallback
  }

  return (
    <CategoryResultPanel
      category={categoryInKorean}
      regions={selectedRegions}
      keywords={activeKeywords}
      onClose={handleClose}
      onSelectPlace={handleSelectPlace}
      isPlaceSelected={isPlaceSelected}
      isOpen={showCategoryResult}
    />
  );
};

export default CategoryResultHandler;
