
import { useState, useEffect, useCallback } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import { useTripDetails } from './use-trip-details';

// Create a separate type for the category mapping to improve readability
type PlacesByCategory = {
  '숙소': Place[];
  '관광지': Place[];
  '음식점': Place[];
  '카페': Place[];
};

export const useSelectedPlaces = () => {
  // State for selected places
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  
  // State for selected places organized by category
  const [selectedPlacesByCategory, setSelectedPlacesByCategory] = useState<PlacesByCategory>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });

  // State for tracking if all categories have selections
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);

  // Get trip details to check accommodation limits
  const { tripDuration } = useTripDetails();
  
  // Get map context for interacting with the map
  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  // Check if all categories have at least one place selected
  useEffect(() => {
    const hasAccommodation = selectedPlacesByCategory['숙소'].length > 0;
    const hasLandmark = selectedPlacesByCategory['관광지'].length > 0;
    const hasRestaurant = selectedPlacesByCategory['음식점'].length > 0;
    const hasCafe = selectedPlacesByCategory['카페'].length > 0;
    
    const allSelected = hasAccommodation && hasLandmark && hasRestaurant && hasCafe;
    
    console.log('카테고리별 선택 현황:', {
      숙소: selectedPlacesByCategory['숙소'].length,
      관광지: selectedPlacesByCategory['관광지'].length,
      음식점: selectedPlacesByCategory['음식점'].length,
      카페: selectedPlacesByCategory['카페'].length,
      모든카테고리선택됨: allSelected
    });
    
    setAllCategoriesSelected(allSelected);
  }, [selectedPlacesByCategory]);

  // Check if accommodation limit reached based on trip duration
  const isAccommodationLimitReached = useCallback((currentCount: number): boolean => {
    if (!tripDuration || tripDuration < 1) return false;
    
    // n박 여행이면 최대 n개의 숙소만 선택 가능
    return currentCount >= tripDuration;
  }, [tripDuration]);

  // Handle selecting or deselecting a place
  const handleSelectPlace = useCallback((place: Place, checked: boolean, category: string | null = null) => {
    if (!category) {
      console.warn('카테고리 값이 누락되었습니다:', place.name);
      return;
    }
    
    // Normalize place ID to ensure it's always a number
    const normalizedPlace = {
      ...place,
      id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id
    };
    
    if (checked) {
      // Check accommodation limit before adding
      if (category === '숙소') {
        const currentAccommodationCount = selectedPlacesByCategory['숙소'].length;
        
        if (isAccommodationLimitReached(currentAccommodationCount)) {
          toast.error(`${tripDuration}박 여행에는 최대 ${tripDuration}개의 숙소만 선택할 수 있습니다.`);
          return;
        }
      }

      // Add to selectedPlaces if not already included
      setSelectedPlaces(prevPlaces => {
        if (prevPlaces.some(p => p.id === normalizedPlace.id)) {
          return prevPlaces;
        }
        return [...prevPlaces, normalizedPlace];
      });
      
      // Add to category-specific collection
      if (category in selectedPlacesByCategory) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: [...prev[category as keyof PlacesByCategory], normalizedPlace]
        }));
      }
    } else {
      // Remove from selectedPlaces
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== normalizedPlace.id));
      
      // Remove from category-specific collection
      if (category in selectedPlacesByCategory) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: prev[category as keyof PlacesByCategory].filter(p => p.id !== normalizedPlace.id)
        }));
      }
    }
  }, [selectedPlacesByCategory, tripDuration, isAccommodationLimitReached]);

  // Handle removing a place from selections
  const handleRemovePlace = useCallback((placeId: string) => {
    const numericId = parseInt(placeId, 10);
    
    // Remove from selectedPlaces
    setSelectedPlaces(prevPlaces => prevPlaces.filter(p => Number(p.id) !== numericId));
    
    // Remove from all category collections where it exists
    setSelectedPlacesByCategory(prev => {
      const updated = { ...prev };
      
      (Object.keys(updated) as Array<keyof PlacesByCategory>).forEach(category => {
        updated[category] = updated[category].filter(p => Number(p.id) !== numericId);
      });
      
      return updated;
    });
  }, []);

  // Handle viewing a place on the map
  const handleViewOnMap = useCallback((place: Place) => {
    clearMarkersAndUiElements();
    addMarkers([place], { highlight: true });
    panTo({ lat: place.y, lng: place.x });
  }, [clearMarkersAndUiElements, addMarkers, panTo]);

  // Prepare payload for schedule generation
  const prepareSchedulePayload = useCallback((
    places: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    // Process selected and candidate places
    const selected: SelectedPlace[] = places
      .filter(p => p.isSelected)
      .map(p => ({ id: Number(p.id), name: p.name }));

    const candidates: SelectedPlace[] = places
      .filter(p => p.isRecommended && !p.isSelected)
      .map(p => ({ id: Number(p.id), name: p.name }));

    console.log('일정 생성 데이터:', {
      선택된_장소: selected.length,
      후보_장소: candidates.length,
      날짜: dateTime
    });

    return {
      selected_places: selected,
      candidate_places: candidates,
      ...dateTime
    };
  }, []);

  return {
    selectedPlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached
  };
};
