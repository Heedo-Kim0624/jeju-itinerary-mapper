import { useState, useEffect } from 'react';
import { Place, SelectedPlace, SchedulePayload } from '@/types/supabase';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import { useTripDetails } from './use-trip-details';
import { getMinimumRecommendationCount } from '@/lib/itinerary/itinerary-utils';

// This function is used locally and also needed for grouping in use-left-panel.
// Consider moving to a shared utility file e.g., src/utils/categoryUtils.ts
const getCategoryKorean = (category?: string): string => {
  if (!category) return '기타';
  
  switch (category.toLowerCase()) {
    case 'accommodation': return '숙소';
    case 'attraction': return '관광지';
    case 'restaurant': return '음식점';
    case 'cafe': return '카페';
    default: return '기타';
  }
};

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
    const providedCategory = category || getCategoryKorean(place.category); // Fallback if category prop is null
    
    if (!providedCategory || !['숙소', '관광지', '음식점', '카페', '기타'].includes(providedCategory) ) {
       console.warn('유효하지 않거나 알 수 없는 카테고리 값입니다:', providedCategory, '장소:', place.name);
    }

    // 타입 호환성을 위해 place.id가 string인지 확인
    const normalizedPlace = { ...place };
    
    if (checked) {
      // If trying to add accommodation, check limit
      if (providedCategory === '숙소') {
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
      
      if (providedCategory && selectedPlacesByCategory[providedCategory as keyof typeof selectedPlacesByCategory]) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [providedCategory]: [...prev[providedCategory as keyof typeof prev], normalizedPlace]
        }));
      }
    } else {
      setSelectedPlaces(prevPlaces => prevPlaces.filter(p => p.id !== normalizedPlace.id));
      
      if (providedCategory && selectedPlacesByCategory[providedCategory as keyof typeof selectedPlacesByCategory]) {
        setSelectedPlacesByCategory(prev => ({
          ...prev,
          [providedCategory]: prev[providedCategory as keyof typeof prev].filter(p => p.id !== normalizedPlace.id)
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
    currentSelectedPlaces: Place[], 
    recommendedPlacesByCategory: { [category: string]: Place[] }, // Expects KOREAN category names as keys
    currentTripDuration: number
  ): Place[] => {
    // Log for Request 1.1
    console.log("autoCompleteWithCandidates 호출됨", {
      selectedCount: currentSelectedPlaces.length,
      tripDuration: currentTripDuration,
      recommendedCategories: Object.keys(recommendedPlacesByCategory)
    });
    console.log("추천 후보 장소 목록 (카테고리별, autoCompleteWithCandidates 입력):", recommendedPlacesByCategory);


    if (!currentTripDuration || currentTripDuration < 1) {
      console.warn('여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
      return currentSelectedPlaces;
    }
    
    const minimumRequirements = getMinimumRecommendationCount(currentTripDuration);
    console.log('카테고리별 최소 필요 장소 수:', minimumRequirements);
    
    const categoryEngToKorMapping: Record<string, string> = {
      'attraction': '관광지',
      'restaurant': '음식점',
      'cafe': '카페',
      'accommodation': '숙소'
    };
    const categoryKorToEngMapping: Record<string, string> = {
      '관광지': 'attraction',
      '음식점': 'restaurant',
      '카페': 'cafe',
      '숙소': 'accommodation'
    };

    const currentSelectedCountsByKoreanCategory: Record<string, Place[]> = {
      '숙소': [], '관광지': [], '음식점': [], '카페': []
    };
    
    currentSelectedPlaces.forEach(place => {
      // Use getCategoryKorean to ensure consistent Korean category names
      const koreanCategory = getCategoryKorean(place.category);
      if (koreanCategory && currentSelectedCountsByKoreanCategory[koreanCategory]) {
        currentSelectedCountsByKoreanCategory[koreanCategory].push(place);
      }
    });
    
    const finalPlaces: Place[] = [...currentSelectedPlaces];
    const autoCompletedCandidatePlaces: Place[] = [];
    
    // Iterate using English category keys from minimumRequirements
    Object.entries(minimumRequirements).forEach(([categoryEng, minCount]) => {
      const categoryKorean = categoryEngToKorMapping[categoryEng];
      if (!categoryKorean) return; // Should not happen if mappings are correct

      const currentCount = currentSelectedCountsByKoreanCategory[categoryKorean]?.length || 0;
      const shortage = Math.max(0, minCount - currentCount);
      
      // Log for Request 1.2
      console.log(`${categoryKorean} (eng: ${categoryEng}) 카테고리: 현재 ${currentCount}개, 최소 ${minCount}개, 부족 ${shortage}개`);

      if (shortage > 0) {
        const availableRecommended = recommendedPlacesByCategory[categoryKorean] || [];
        // Log for Request 1.3 (part 1: candidate pool for this category)
        console.log(`추천 후보 (${categoryKorean}):`, availableRecommended.map(p => ({name: p.name, id: p.id})));

        const candidatesToAdd = availableRecommended
          .filter(rp => !currentSelectedPlaces.some(sp => sp.id === rp.id) && !autoCompletedCandidatePlaces.some(acp => acp.id === rp.id))
          .slice(0, shortage); // Assuming recommendedPlacesByCategory are already sorted by score
          
        if (candidatesToAdd.length > 0) {
          // Log for Request 1.3 (part 2: actual candidates added)
          console.log(`${categoryKorean} 카테고리에 ${candidatesToAdd.length}개 장소 자동 추가:`, 
            candidatesToAdd.map(p => ({name: p.name, id: p.id})));
          
          const markedCandidates = candidatesToAdd.map(p => ({
            ...p,
            isCandidate: true 
          }));
          
          finalPlaces.push(...markedCandidates);
          autoCompletedCandidatePlaces.push(...markedCandidates);
        } else {
          console.warn(`${categoryKorean} 카테고리의 추천 장소가 부족하거나 이미 선택된 장소입니다. (부족분: ${shortage}, 사용가능 추천: ${availableRecommended.length})`);
        }
      }
    });
    
    setCandidatePlaces(prev => [...prev, ...autoCompletedCandidatePlaces.filter(acp => !prev.some(p => p.id === acp.id))]);
    
    if (autoCompletedCandidatePlaces.length > 0) {
      console.log(`총 ${autoCompletedCandidatePlaces.length}개의 장소가 자동으로 추가되었습니다.`);
      toast.info(`${autoCompletedCandidatePlaces.length}개의 추천 장소가 자동으로 추가되었습니다.`);
    }
    
    return finalPlaces;
  };

  // 영문 카테고리를 한글로 변환
  const getCategoryKorean = (category?: string): string => {
    if (!category) return '기타';
    
    switch (category.toLowerCase()) {
      case 'accommodation': return '숙소';
      case 'attraction': return '관광지';
      case 'restaurant': return '음식점';
      case 'cafe': return '카페';
      default: return '기타';
    }
  };

  const prepareSchedulePayload = (
    placesToSchedule: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null,
    // This is expected to be Record<KoreanCategoryName, Place[]>
    availableRecommendedPlacesByCategory: { [category: string]: Place[] } = {} 
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    const startDate = new Date(dateTime.start_datetime);
    const endDate = new Date(dateTime.end_datetime);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // autoCompleteWithCandidates expects KOREAN category names as keys for availableRecommendedPlacesByCategory
    const enrichedPlaces = autoCompleteWithCandidates(placesToSchedule, availableRecommendedPlacesByCategory, tripDays);

    const userSelected: SelectedPlace[] = enrichedPlaces
      .filter(p => !p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    const autoCandidates: SelectedPlace[] = enrichedPlaces
      .filter(p => p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    console.log('일정 생성 데이터 (prepareSchedulePayload):', {
      사용자선택_장소수: userSelected.length,
      자동후보_장소수: autoCandidates.length,
      총_장소수: enrichedPlaces.length,
      날짜: dateTime,
      payload_selected: userSelected.map(p=>p.name),
      payload_candidates: autoCandidates.map(p=>p.name),
    });

    return {
      selected_places: userSelected,
      candidate_places: autoCandidates,
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
    autoCompleteWithCandidates // Exposing it if needed elsewhere, though primarily used by prepareSchedulePayload
  };
};
