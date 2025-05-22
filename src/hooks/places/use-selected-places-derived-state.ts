import { useMemo } from 'react';
import { SelectedPlace } from '@/types/core';
import { useSelectedPlaces } from '../use-selected-places';
import type { CategoryName } from '@/types/core/base-types';

/**
 * 選択された場所の状態を管理するカスタムフック
 *
 * @returns {object} 選択された場所の状態と操作関数
 */
export const useSelectedPlacesDerivedState = () => {
  const { selectedPlaces } = useSelectedPlaces();

  // 初期状態を生成する関数
  // CategoryName タイプがアップデートされたので、すべてのカテゴリを含むように修正
  const getInitialSelectedPlacesByCategory = (): Record<CategoryName, SelectedPlace[]> => {
    return {
      '숙소': [],
      '관광지': [],
      '음식점': [],
      '카페': [],
      '교통': [],
      '기타': []
    };
  };

  // カテゴリ別に選択された場所を管理する状態
  const selectedPlacesByCategory = useMemo(() => {
    // 初期状態を生成
    const initialSelectedPlacesByCategory = getInitialSelectedPlacesByCategory();

    // 選択された場所をカテゴリ別に分類
    selectedPlaces.forEach((place) => {
      if (place.category && initialSelectedPlacesByCategory[place.category as CategoryName]) {
        initialSelectedPlacesByCategory[place.category as CategoryName].push(place);
      }
    });

    return initialSelectedPlacesByCategory;
  }, [selectedPlaces]);

  return { selectedPlacesByCategory };
};
