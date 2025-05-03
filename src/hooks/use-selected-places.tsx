
import { useState, useEffect } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';

export const useSelectedPlaces = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [selectedPlacesByCategory, setSelectedPlacesByCategory] = useState<{
    '숙소': Place[],
    '관광지': Place[],
    '음식점': Place[],
    '카페': Place[],
  }>({
    '숙소': [],
    '관광지': [],
    '음식점': [],
    '카페': [],
  });

  // allCategoriesSelected 상태를 명확하게 계산
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);
  
  useEffect(() => {
    // 각 카테고리별로 최소 1개 이상 선택되었는지 확인
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

  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  const handleSelectPlace = (place: Place, checked: boolean, category: string | null = null) => {
    // Ensure place.id is always a number
    const normalizedPlace = {
      ...place,
      id: typeof place.id === 'string' ? parseInt(place.id, 10) : place.id
    };
    
    if (checked) {
      setSelectedPlaces(prevPlaces => {
        if (prevPlaces.some(p => p.id === normalizedPlace.id)) {
          return prevPlaces;
        }
        return [...prevPlaces, normalizedPlace];
      });
      
      if (category) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: [...prev[category as keyof typeof prev], normalizedPlace]
        }));
      }
    } else {
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== normalizedPlace.id));
      
      if (category) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: prev[category as keyof typeof prev].filter(p => p.id !== normalizedPlace.id)
        }));
      }
    }
  };

  const handleRemovePlace = (placeId: string) => {
    const numericId = parseInt(placeId, 10);
    const placeToRemove = selectedPlaces.find(p => Number(p.id) === numericId);
    
    setSelectedPlaces(prevPlaces => prevPlaces.filter(p => Number(p.id) !== numericId));
    
    if (placeToRemove) {
      Object.keys(selectedPlacesByCategory).forEach(category => {
        const categoryKey = category as keyof typeof selectedPlacesByCategory;
        if (selectedPlacesByCategory[categoryKey].some(p => Number(p.id) === numericId)) {
          setSelectedPlacesByCategory(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter(p => Number(p.id) !== numericId)
          }));
        }
      });
    }
  };

  const handleViewOnMap = (place: Place) => {
    clearMarkersAndUiElements();
    addMarkers([place], { highlight: true });
    panTo({ lat: place.y, lng: place.x });
  };

  const prepareSchedulePayload = (
    places: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    // 선택된 장소를 처리
    const selected: SelectedPlace[] = places
      .filter(p => p.isSelected)
      .map(p => ({ id: Number(p.id), name: p.name }));

    // 추천되었지만 선택되지 않은 장소를 후보 장소로 처리
    const candidates: SelectedPlace[] = places
      .filter(p => p.isRecommended && !p.isSelected)
      .map(p => ({ id: Number(p.id), name: p.name }));

    // 후보 장소가 제대로 처리되는지 로깅
    console.log('일정 생성 데이터:', {
      선택된_장소: selected.length,
      후보_장소: candidates.length,
      날짜: dateTime
    });

    if (candidates.length > 0) {
      console.log('후보 장소 목록:', candidates);
    }

    return {
      selected_places: selected,
      candidate_places: candidates,
      ...dateTime
    };
  };

  return {
    selectedPlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload
  };
};
