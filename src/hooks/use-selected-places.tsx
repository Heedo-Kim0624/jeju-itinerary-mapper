
import { useState, useEffect } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import { useTripDetails } from './use-trip-details';

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

  // Get trip details to check accommodation limits
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

  // 여행 일정에 따른 필요 장소 수 계산 (새로운 함수)
  const calculateRequiredPlaces = (days: number | null): { [category: string]: number } => {
    if (!days || days < 1) {
      return {
        '관광지': 0,
        '음식점': 0,
        '카페': 0,
        '숙소': 0
      };
    }

    return {
      '관광지': 4 * days, // 관광지: 4n개
      '음식점': 3 * days, // 음식점: 3n개
      '카페': 3 * days,   // 카페: 3n개
      '숙소': days        // 숙소: n개 (1박에 1개)
    };
  };

  // 사용자가 선택한 장소가 부족할 경우 후보 장소 자동 추가 기능 (새로운 함수)
  const generateCandidatePlaces = (
    allPlaces: { [category: string]: Place[] },
    requiredCounts: { [category: string]: number }
  ): Place[] => {
    const candidates: Place[] = [];
    
    // 각 카테고리별로 부족한 장소 수 계산 및 후보 장소 추가
    ['관광지', '음식점', '카페'].forEach(category => {
      const categoryKey = category as keyof typeof selectedPlacesByCategory;
      const selectedCount = selectedPlacesByCategory[categoryKey].length;
      const requiredCount = requiredCounts[category];
      const neededCount = Math.max(0, requiredCount - selectedCount);
      
      if (neededCount > 0) {
        console.log(`${category} 카테고리 후보지 ${neededCount}개 자동 추가 필요`);
        
        // 이미 선택된 장소 ID 목록
        const selectedIds = selectedPlacesByCategory[categoryKey].map(p => p.id);
        
        // 선택되지 않은 장소 중 가중치 높은 순으로 정렬
        const availablePlaces = allPlaces[category]
          ?.filter(p => !selectedIds.includes(p.id))
          ?.sort((a, b) => (b.weight || 0) - (a.weight || 0)) || [];
        
        // 필요한 수만큼 후보 장소 추가
        const candidatesForCategory = availablePlaces.slice(0, neededCount);
        candidates.push(...candidatesForCategory);
        
        console.log(`${category} 자동 후보지 ${candidatesForCategory.length}개 추가됨`);
      }
    });
    
    return candidates;
  };

  // 일정 생성을 위한 데이터 준비 함수 업데이트
  const prepareSchedulePayload = (
    places: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null,
    allAvailablePlaces: { [category: string]: Place[] } = {}
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    // 선택된 장소를 처리
    const selected: SelectedPlace[] = places.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id, 
      name: p.name 
    }));

    // 여행 일수 계산
    const startDate = new Date(dateTime.start_datetime);
    const endDate = new Date(dateTime.end_datetime);
    const diffTime = endDate.getTime() - startDate.getTime();
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
    
    console.log(`여행 일수: ${days}일`);

    // 필요한 장소 수 계산
    const requiredPlaces = calculateRequiredPlaces(days);
    console.log('필요 장소 수:', requiredPlaces);
    
    // 현재 선택된 장소 수 확인
    console.log('현재 선택된 장소 수:', {
      '관광지': selectedPlacesByCategory['관광지'].length,
      '음식점': selectedPlacesByCategory['음식점'].length,
      '카페': selectedPlacesByCategory['카페'].length,
      '숙소': selectedPlacesByCategory['숙소'].length
    });

    // 후보 장소 자동 생성
    const candidatePlaces = generateCandidatePlaces(allAvailablePlaces, requiredPlaces);
    
    // 후보 장소를 SelectedPlace 타입으로 변환
    const candidates: SelectedPlace[] = candidatePlaces.map(p => ({ 
      id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id, 
      name: p.name 
    }));

    console.log('일정 생성 데이터:', {
      선택된_장소: selected.length,
      후보_장소: candidates.length,
      날짜: dateTime
    });

    if (candidates.length > 0) {
      console.log('후보 장소 목록:', candidates.map(c => c.name).join(', '));
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
    prepareSchedulePayload,
    isAccommodationLimitReached,
    calculateRequiredPlaces
  };
};
