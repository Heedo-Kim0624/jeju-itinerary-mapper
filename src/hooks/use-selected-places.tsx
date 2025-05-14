
import { useState, useEffect } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import { useTripDetails } from './use-trip-details';

export const useSelectedPlaces = () => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [candidatePlaces, setCandidatePlaces] = useState<Place[]>([]);
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

  // Get trip details to check accommodation limits and trip duration
  const { tripDuration } = useTripDetails();

  // allCategoriesSelected 상태를 명확하게 계산
  const [allCategoriesSelected, setAllCategoriesSelected] = useState(false);
  
  // 더 자세한 디버깅을 위해 카테고리별 선택 여부 상태 추가
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

  // Check if accommodation limit reached
  const isAccommodationLimitReached = (currentCount: number): boolean => {
    if (!tripDuration || tripDuration < 1) return false;
    
    // n박 여행이면 최대 n개의 숙소만 선택 가능
    return currentCount >= tripDuration;
  };

  const handleSelectPlace = (place: Place, checked: boolean, category: string | null = null) => {
    // 카테고리가 제공되었는지 확인하고, 누락된 경우 콘솔 로그 추가
    if (!category) {
      console.warn('카테고리 값이 누락되었습니다:', place.name);
    }
    
    // 타입 호환성을 위해 place.id가 string인지 확인
    const normalizedPlace = { ...place };
    
    if (checked) {
      // If trying to add accommodation, check limit
      if (category === '숙소') {
        const currentAccommodationCount = selectedPlacesByCategory['숙소'].length;
        
        if (isAccommodationLimitReached(currentAccommodationCount)) {
          toast.error(`${tripDuration}박 여행에는 최대 ${tripDuration}개의 숙소만 선택할 수 있습니다.`);
          return;
        }
      }

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
    // 타입 호환성을 위해 직접 비교
    const placeToRemove = selectedPlaces.find(p => p.id === placeId);
    
    // 장소 제거 시 해당 카테고리에서도 제거
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

  // 후보 장소 자동 보완 기능
  const autoCompleteWithCandidates = (
    selectedPlaces: Place[], 
    recommendedPlacesByCategory: { [category: string]: Place[] },
    tripDuration: number
  ): Place[] => {
    if (!tripDuration || tripDuration < 1) {
      console.warn('여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
      return selectedPlaces;
    }
    
    // 카테고리별 최소 필요 개수 계산
    const minimumRequirements = {
      '관광지': 4 * tripDuration,
      '음식점': 3 * tripDuration,
      '카페': 3 * tripDuration,
      '숙소': Math.min(tripDuration, 1) // 숙소는 최대 여행일수만큼
    };
    
    console.log('카테고리별 최소 필요 장소 수:', minimumRequirements);
    
    // 카테고리별 현재 선택된 장소 수 계산
    const selectedCountsByCategory: Record<string, Place[]> = {
      '관광지': [],
      '음식점': [],
      '카페': [],
      '숙소': []
    };
    
    // 선택된 장소들을 카테고리별로 분류
    selectedPlaces.forEach(place => {
      const category = place.category;
      if (category && selectedCountsByCategory[category]) {
        selectedCountsByCategory[category].push(place);
      }
    });
    
    // 최종 장소 목록 (선택된 장소 + 자동 보완된 후보 장소)
    const finalPlaces: Place[] = [...selectedPlaces];
    const autoCompletedPlaces: Place[] = [];
    
    // 각 카테고리별로 부족한 개수만큼 추천 장소에서 보완
    Object.entries(minimumRequirements).forEach(([category, minCount]) => {
      const currentCount = selectedCountsByCategory[category]?.length || 0;
      const shortage = Math.max(0, minCount - currentCount);
      
      if (shortage > 0) {
        console.log(`${category} 카테고리 부족 개수: ${shortage}개`);
        
        // 해당 카테고리의 추천 장소 목록에서 상위 N개 가져오기
        const recommendedPlaces = recommendedPlacesByCategory[category] || [];
        
        // 이미 선택된 장소는 제외하고 필요한 만큼만 추가
        const candidatesToAdd = recommendedPlaces
          .filter(rp => !selectedPlaces.some(sp => sp.id === rp.id))
          .slice(0, shortage);
          
        if (candidatesToAdd.length > 0) {
          console.log(`${category} 카테고리에 ${candidatesToAdd.length}개 장소 자동 추가:`, 
            candidatesToAdd.map(p => p.name).join(', '));
          
          // 후보 장소에 isCandidate 속성 추가 (Place 타입에 추가된 옵션 속성 활용)
          const markedCandidates = candidatesToAdd.map(p => ({
            ...p,
            isCandidate: true // 자동 추가된 후보 장소임을 표시
          }));
          
          finalPlaces.push(...markedCandidates);
          autoCompletedPlaces.push(...markedCandidates);
        } else {
          console.warn(`${category} 카테고리의 추천 장소가 부족합니다.`);
        }
      }
    });
    
    // 자동 추가된 장소 정보 저장
    setCandidatePlaces(autoCompletedPlaces);
    
    if (autoCompletedPlaces.length > 0) {
      console.log(`총 ${autoCompletedPlaces.length}개의 장소가 자동으로 추가되었습니다.`);
      toast.success(`${autoCompletedPlaces.length}개의 추천 장소가 자동으로 추가되었습니다.`);
    }
    
    return finalPlaces;
  };

  const prepareSchedulePayload = (
    places: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null,
    allAvailablePlaces: { [category: string]: Place[] } = {}
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    // 여행 일수 계산
    const startDate = new Date(dateTime.start_datetime);
    const endDate = new Date(dateTime.end_datetime);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // 선택한 장소에 후보 장소 자동 보완
    const enrichedPlaces = autoCompleteWithCandidates(places, allAvailablePlaces, tripDays);

    // 사용자가 직접 선택한 장소
    const selected: SelectedPlace[] = places
      .filter(p => !p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    // 자동으로 추가된 후보 장소
    const candidates: SelectedPlace[] = enrichedPlaces
      .filter(p => p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    // 후보 장소가 제대로 처리되는지 로깅
    console.log('일정 생성 데이터:', {
      선택된_장소: selected.length,
      후보_장소: candidates.length,
      총_장소: selected.length + candidates.length,
      날짜: dateTime
    });

    return {
      selected_places: selected,
      candidate_places: candidates,
      ...dateTime
    };
  };

  return {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    prepareSchedulePayload,
    isAccommodationLimitReached,
    autoCompleteWithCandidates
  };
};
