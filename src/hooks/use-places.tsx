
import { useState } from 'react';
import { useSelectedPlaces } from './use-selected-places';
import { Place } from '@/types/supabase';

export interface CategoryPlaces {
  regions?: string[];
  keywords?: string[];
}

export const usePlaces = () => {
  const { 
    selectedPlaces, 
    selectedPlacesByCategory, 
    handleSelectPlace: handleSelectPlaceInternal,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    updateRecommendedPlaceList,
    recommendedPlacesByCategory
  } = useSelectedPlaces();

  const [categoryPlacesList, setCategoryPlacesList] = useState<Record<string, CategoryPlaces>>({
    accommodation: { regions: [], keywords: [] },
    landmark: { regions: [], keywords: [] },
    restaurant: { regions: [], keywords: [] },
    cafe: { regions: [], keywords: [] },
  });

  // 카테고리 매핑
  const categoryMapping: Record<string, keyof typeof selectedPlacesByCategory> = {
    'accommodation': '숙소',
    'landmark': '관광지',
    'restaurant': '음식점',
    'cafe': '카페'
  };

  const handleSelectPlace = (place: Place, checked: boolean, categoryName: string) => {
    const mappedCategory = categoryMapping[categoryName] || categoryName;
    handleSelectPlaceInternal(place, checked, mappedCategory);
  };

  const isPlaceSelected = (id: string | number) => {
    return selectedPlaces.some(place => place.id === id);
  };

  // 카테고리별 장소 관리
  const setCategoryPlaces = (
    category: string,
    regions: string[] = [],
    keywords: string[] = []
  ) => {
    setCategoryPlacesList(prev => ({
      ...prev,
      [category]: { regions, keywords },
    }));
  };

  return {
    selectedPlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    isPlaceSelected,
    categoryPlacesList,
    setCategoryPlaces,
    allCategoriesSelected,
    prepareSchedulePayload,
    updateRecommendedPlaceList,
    recommendedPlacesByCategory
  };
};
