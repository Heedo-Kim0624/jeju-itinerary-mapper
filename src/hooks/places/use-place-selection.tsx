
import { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { CategoryName, getCategoryKorean, areAllCategoriesSelected } from '@/utils/categoryUtils';
import { toast } from 'sonner';

/**
 * Hook for managing place selections
 */
export const usePlaceSelection = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [candidatePlaces, setCandidatePlaces] = useState<Place[]>([]);
  const [selectedPlacesByCategory, setSelectedPlacesByCategory] = useState<Record<CategoryName, Place[]>>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
    '기타': []
  });

  // Calculate if all categories have at least one selection
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);
  
  useEffect(() => {
    // Check if each category has at least one place selected
    const hasAllCategories = areAllCategoriesSelected(selectedPlacesByCategory);
    
    // Log for debugging
    console.log('카테고리별 선택 현황:', {
      숙소: selectedPlacesByCategory['숙소'].length,
      관광지: selectedPlacesByCategory['관광지'].length,
      음식점: selectedPlacesByCategory['음식점'].length,
      카페: selectedPlacesByCategory['카페'].length,
      모든카테고리선택됨: hasAllCategories
    });
    
    setAllCategoriesSelected(hasAllCategories);
  }, [selectedPlacesByCategory]);

  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  /**
   * Add or remove a place from the selected places
   */
  const handleSelectPlace = (place: Place, checked: boolean, category: string | null = null) => {
    // Get category, either from parameter or from place object
    const providedCategory = category || getCategoryKorean(place.category);
    
    if (!providedCategory) {
      console.warn('유효하지 않거나 알 수 없는 카테고리 값입니다:', providedCategory, '장소:', place.name);
    }

    // Ensure place.id is treated as string
    const normalizedPlace = { ...place };
    
    if (checked) {
      setSelectedPlaces(prevPlaces => {
        if (prevPlaces.some(p => p.id === normalizedPlace.id)) {
          return prevPlaces;
        }
        return [...prevPlaces, normalizedPlace];
      });
      
      if (providedCategory) {
        setSelectedPlacesByCategory(prev => {
          // Safely update category
          if (Object.prototype.hasOwnProperty.call(prev, providedCategory)) {
            return {
              ...prev,
              [providedCategory]: [...prev[providedCategory as CategoryName], normalizedPlace]
            };
          }
          return prev;
        });
      }
    } else {
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== normalizedPlace.id));
      
      if (providedCategory) {
        setSelectedPlacesByCategory(prev => {
          // Safely update category
          if (Object.prototype.hasOwnProperty.call(prev, providedCategory)) {
            return {
              ...prev,
              [providedCategory]: prev[providedCategory as CategoryName].filter(p => p.id !== normalizedPlace.id)
            };
          }
          return prev;
        });
      }
    }
  };

  /**
   * Remove a place from the selected places
   */
  const handleRemovePlace = (placeId: string) => {
    const placeToRemove = selectedPlaces.find(p => p.id === placeId);
    
    // Remove from the main selected places array
    setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));
    
    if (placeToRemove) {
      // Remove from the category-specific arrays
      Object.keys(selectedPlacesByCategory).forEach(category => {
        const categoryKey = category as CategoryName;
        if (selectedPlacesByCategory[categoryKey].some(p => p.id === placeId)) {
          setSelectedPlacesByCategory(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter(p => p.id !== placeId)
          }));
        }
      });
    }
  };

  /**
   * Focus the map on a specific place
   */
  const handleViewOnMap = (place: Place) => {
    clearMarkersAndUiElements();
    addMarkers([place], { highlight: true });
    panTo({ lat: place.y, lng: place.x });
  };

  return {
    selectedPlaces,
    setSelectedPlaces,
    candidatePlaces,
    setCandidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected
  };
};
