
import React, { useEffect, useState } from 'react';
import { Place } from '@/types/supabase';
import { toast } from 'sonner';
import { useCategoryResults } from '@/hooks/use-category-results';
import { RegionDetails } from '@/utils/regionData';
import CategoryResultsPanel from './CategoryResultsPanel';

// Updated to support CategoryName types
type CategoryName = '숙소' | '관광지' | '음식점' | '카페';

interface CategoryResultHandlerProps {
  showCategoryResult: string | null;
  selectedRegions: RegionDetails[];
  selectedKeywordsByCategory: { [category: string]: string[] };
  onClose: () => void;
  onSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
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
  const [selectedCount, setSelectedCount] = useState<number>(0);

  // Fix the type issue by casting showCategoryResult to CategoryName when it's valid
  let validCategory: CategoryName | null = null;
  if (showCategoryResult === '숙소' || 
      showCategoryResult === '관광지' || 
      showCategoryResult === '음식점' || 
      showCategoryResult === '카페') {
    validCategory = showCategoryResult;
  }

  const { 
    isLoading, 
    error, 
    recommendedPlaces,
    normalPlaces, 
    refetch 
  } = useCategoryResults(
    validCategory, 
    validCategory ? selectedKeywordsByCategory[validCategory] || [] : [],
    selectedRegions
  );

  useEffect(() => {
    if (error) {
      toast.error("카테고리 결과를 불러오는 중 오류가 발생했습니다.");
      console.error("카테고리 결과 로딩 오류:", error);
    }
  }, [error]);

  useEffect(() => {
    // Count the number of selected places for the current category
    if (showCategoryResult) {
      const count = selectedPlaces.filter(place => {
        const categoryName = getCategoryName(place.category);
        return categoryName === showCategoryResult;
      }).length;
      
      setSelectedCount(count);
    }
  }, [selectedPlaces, showCategoryResult]);

  // Helper function to get Korean category name
  const getCategoryName = (category?: string): string => {
    if (!category) return '기타';
    
    switch (category.toLowerCase()) {
      case 'accommodation': return '숙소';
      case 'attraction': return '관광지';
      case 'restaurant': return '음식점';
      case 'cafe': return '카페';
      default: return '기타';
    }
  };

  if (!showCategoryResult) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <CategoryResultsPanel
        category={showCategoryResult}
        isLoading={isLoading}
        recommendedPlaces={recommendedPlaces || []}
        normalPlaces={normalPlaces || []}
        selectedPlaces={selectedPlaces}
        onSelectPlace={onSelectPlace}
        onClose={onClose}
        selectedCount={selectedCount}
      />
    </div>
  );
};

export default CategoryResultHandler;
