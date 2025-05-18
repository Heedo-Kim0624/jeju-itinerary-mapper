
import { useCallback } from 'react';
import { Place, SelectedPlace } from '@/types/supabase';
import { CategoryName, CATEGORIES, englishCategoryNameToKorean, koreanToEnglishCategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

interface UsePlaceSelectionLogicProps {
  setSelectedPlaces: React.Dispatch<React.SetStateAction<SelectedPlace[]>>;
  tripDuration: number | null;
}

export const usePlaceSelectionLogic = ({
  setSelectedPlaces,
  tripDuration,
}: UsePlaceSelectionLogicProps) => {
  const handleSelectPlace = useCallback((place: Place, checked: boolean, categoryOverride?: CategoryName) => {
    // place.category could be Korean or English from source. Normalize to English CategoryName.
    // categoryOverride is already English CategoryName.
    let placeCategoryEnglish: CategoryName | null = categoryOverride || null;

    if (!placeCategoryEnglish && place.category) {
        // Try to convert if place.category is Korean
        placeCategoryEnglish = koreanToEnglishCategoryName(place.category);
        // If it's already English and a valid CategoryName, it might pass through directly
        if (!placeCategoryEnglish && CATEGORIES.includes(place.category as CategoryName)) {
            placeCategoryEnglish = place.category as CategoryName;
        }
    }
    
    if (!placeCategoryEnglish) {
      console.warn(`[장소 선택] 유효하지 않은 카테고리 (${place.category}) 또는 장소 정보 부족:`, place);
      toast.error("장소 정보에 오류가 있어 선택할 수 없습니다.");
      return;
    }

    const finalCategory = placeCategoryEnglish; // Ensure it's English CategoryName

    setSelectedPlaces(prev => {
      const newSelectedPlace: SelectedPlace = {
        ...place,
        category: finalCategory, // Store English CategoryName
        isSelected: checked,
        isCandidate: false,
      };

      if (checked) {
        if (finalCategory === 'accommodation') { // Compare with English CategoryName
          const currentAccommodations = prev.filter(p => p.category === 'accommodation'); // Compare with English
          const maxAccommodations = tripDuration !== null && tripDuration >= 0 ? Math.max(tripDuration, 1) : 1;

          if (currentAccommodations.length >= maxAccommodations) {
            toast.info(`숙소는 최대 ${maxAccommodations}개까지 선택할 수 있습니다. 기존 숙소를 변경하려면 먼저 삭제해주세요.`);
            return prev;
          }
        }
        if (!prev.find(p => p.id === place.id)) {
          return [...prev, newSelectedPlace];
        }
        return prev;
      } else {
        return prev.filter(p => p.id !== place.id);
      }
    });
  }, [setSelectedPlaces, tripDuration]);

  return {
    handleSelectPlace,
  };
};
