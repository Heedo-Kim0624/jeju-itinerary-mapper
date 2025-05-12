
import { useState, useCallback, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { CategoryName } from '@/utils/categoryUtils';
import { toast } from 'sonner';

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
    console.log(`장소 ${checked ? '선택' : '해제'}: ${place.name} (ID: ${place.id})`);
    if (checked) {
      setSelectedPlaces(prev => [...prev, place]);
      toast.success(`${place.name} 장소가 추가되었습니다.`);
    } else {
      setSelectedPlaces(prev => prev.filter(p => p.id !== place.id));
      toast.info(`${place.name} 장소가 제거되었습니다.`);
    }
  }, []);

  // 장소 삭제 처리
  const handleRemovePlace = useCallback((placeId: number | string) => {
    console.log(`장소 삭제: ID ${placeId}`);
    setSelectedPlaces(prev => {
      const placeToRemove = prev.find(p => p.id === placeId);
      if (placeToRemove) {
        toast.info(`${placeToRemove.name} 장소가 제거되었습니다.`);
      }
      return prev.filter(p => p.id !== placeId);
    });
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
    setSelectedKeywords(prev => {
      // 기존 키워드와 비교하여 변경사항이 있는지 확인
      const prevKeywords = prev[category];
      const hasChanges = JSON.stringify(prevKeywords) !== JSON.stringify(keywords);
      
      if (hasChanges) {
        console.log(`${category} 키워드 상태 업데이트됨:`, keywords);
        return {
          ...prev,
          [category]: keywords
        };
      }
      
      console.log(`${category} 키워드 변경사항 없음`);
      return prev;
    });
  }, []);

  // 개발용 로깅
  useEffect(() => {
    console.log('선택된 키워드 업데이트:', selectedKeywords);
    console.log('모든 카테고리 선택 여부:', allCategoriesSelected);
  }, [selectedKeywords, allCategoriesSelected]);
  
  // 장소 목록 변경 로깅
  useEffect(() => {
    console.log(`선택된 장소 목록 업데이트: ${selectedPlaces.length}개 장소`);
  }, [selectedPlaces.length]);

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
