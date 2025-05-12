
import { useState, useCallback, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';

export const useSelectedPlaces = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [selectedKeywords, setSelectedKeywords] = useState<Record<CategoryName, string[]>>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': []
  });

  // 장소 선택 처리
  const handleSelectPlace = useCallback((place: Place, checked: boolean) => {
    if (checked) {
      setSelectedPlaces(prev => [...prev, place]);
    } else {
      setSelectedPlaces(prev => prev.filter(p => p.id !== place.id));
    }
  }, []);

  // 장소 삭제 처리
  const handleRemovePlace = useCallback((placeId: number | string) => {
    setSelectedPlaces(prev => prev.filter(p => p.id !== placeId));
  }, []);

  // 모든 카테고리 선택 여부 확인
  const allCategoriesSelected = selectedKeywords['숙소'].length > 0 &&
    selectedKeywords['관광지'].length > 0 &&
    selectedKeywords['음식점'].length > 0 &&
    selectedKeywords['카페'].length > 0;

  // 지도에서 장소 보기
  const handleViewOnMap = useCallback((place: Place) => {
    console.log('지도에서 보기:', place);
    // 지도 관련 로직은 여기에 구현
  }, []);

  // 키워드 업데이트 함수
  const updateKeywords = useCallback((category: CategoryName, keywords: string[]) => {
    console.log(`${category} 키워드 업데이트:`, keywords);
    setSelectedKeywords(prev => ({
      ...prev,
      [category]: keywords
    }));
  }, []);

  // 개발용 로깅
  useEffect(() => {
    console.log('선택된 키워드 업데이트:', selectedKeywords);
    console.log('모든 카테고리 선택 여부:', allCategoriesSelected);
  }, [selectedKeywords, allCategoriesSelected]);

  return {
    selectedPlaces,
    selectedKeywords,
    updateKeywords,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
  };
};
