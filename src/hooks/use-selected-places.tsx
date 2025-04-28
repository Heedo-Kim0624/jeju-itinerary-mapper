import { useState } from 'react';
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

  const { panTo, addMarkers, clearMarkersAndUiElements } = useMapContext();

  const handleSelectPlace = (place: Place, checked: boolean, category: string | null = null) => {
    if (checked) {
      setSelectedPlaces(prevPlaces => {
        if (prevPlaces.some(p => p.id === place.id)) {
          return prevPlaces;
        }
        return [...prevPlaces, place];
      });
      
      if (category) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: [...prev[category as keyof typeof prev], place]
        }));
      }
    } else {
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== place.id));
      
      if (category) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [category]: prev[category as keyof typeof prev].filter(p => p.id !== place.id)
        }));
      }
    }
  };

  const handleRemovePlace = (placeId: string) => {
    const placeToRemove = selectedPlaces.find(p => p.id === placeId);
    
    setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== placeId));
    
    if (placeToRemove) {
      Object.keys(selectedPlacesByCategory).forEach(category => {
        const categoryKey = category as keyof typeof selectedPlacesByCategory;
        if (selectedPlacesByCategory[categoryKey].some(p => p.id === placeId)) {
          setSelectedPlacesByCategory(prev => ({
            ...prev,
            [categoryKey]: prev[categoryKey].filter(p => p.id !== placeId)
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

  const allCategoriesSelected = 
    selectedPlacesByCategory['숙소'].length > 0 && 
    selectedPlacesByCategory['관광지'].length > 0 && 
    selectedPlacesByCategory['음식점'].length > 0 && 
    selectedPlacesByCategory['카페'].length > 0;

  const prepareSchedulePayload = (
    places: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    const selected: SelectedPlace[] = places
      .filter(p => p.isSelected)
      .map(p => ({ id: p.id, name: p.name }));

    const candidates: SelectedPlace[] = places
      .filter(p => p.isRecommended && !p.isSelected)
      .map(p => ({ id: p.id, name: p.name }));

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
