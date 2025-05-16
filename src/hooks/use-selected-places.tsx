
import { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { autoCompleteCandidatePlaces, getCategoryKorean, getMinimumRecommendationCount } from '@/lib/itinerary/place-recommendation-utils';
import { useMapContext } from '@/components/rightpanel/MapContext';
import { toast } from 'sonner';
import { useTripDetails } from './use-trip-details';
import type { SchedulePayload, SchedulePlace } from '@/types/schedule';

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

  // Enhanced auto-completion function with better trip duration handling
  const handleAutoCompletePlaces = (category: string, recommendedPlaces: Place[]) => {
    if (!tripDuration || tripDuration < 1) {
      console.warn('[자동 보완] 여행 기간이 설정되지 않아 자동 보완을 실행할 수 없습니다.');
      toast.error('여행 일정을 먼저 설정해주세요!');
      return;
    }
    
    console.log(`[자동 보완] ${category} 카테고리에 대한 자동 보완 시작 (여행 기간: ${tripDuration}일)`);
    
    // Define minimum recommended count based on trip duration
    const minRecommendationCount = getMinimumRecommendationCount(tripDuration);
    console.log(`[자동 보완] 최소 추천 개수 (${category}): ${JSON.stringify(minRecommendationCount)}`);
    
    // Map Korean category to English
    const categoryMap: Record<string, keyof typeof minRecommendationCount> = {
      '숙소': 'accommodation',
      '관광지': 'touristSpot',
      '음식점': 'restaurant',
      '카페': 'cafe'
    };
    
    // Get the target count for current category
    const englishCategory = categoryMap[category] || 'touristSpot';
    const targetCount = minRecommendationCount[englishCategory];
    const currentCount = selectedPlacesByCategory[category as keyof typeof selectedPlacesByCategory]?.length || 0;
    
    console.log(`[자동 보완] 현재 선택된 ${category} 개수: ${currentCount}, 목표 개수: ${targetCount}`);
    
    // If we already have enough places, don't add more
    if (currentCount >= targetCount) {
      console.log(`[자동 보완] ${category} 카테고리는 이미 충분한 장소가 선택되어 있습니다.`);
      return;
    }
    
    // Create a dictionary of recommended places by category
    const recommendedByCategory: Record<string, Place[]> = {
      '숙소': [],
      '관광지': [],
      '음식점': [],
      '카페': []
    };
    
    // Add current recommended places to the appropriate category
    recommendedByCategory[category] = recommendedPlaces;
    
    // Run the auto-complete logic
    const { finalPlaces, addedPlaces } = autoCompleteCandidatePlaces(
      selectedPlaces, 
      recommendedByCategory,
      tripDuration
    );
    
    if (addedPlaces.length > 0) {
      // Mark added places as candidates
      const markedAddedPlaces = addedPlaces.map(place => ({
        ...place,
        isCandidate: true  // Mark as auto-added candidate
      }));
      
      // Update the candidate places list
      setCandidatePlaces(prev => [...prev, ...markedAddedPlaces]);
      
      // Update the selected places list with all combined places
      setSelectedPlaces(finalPlaces.map(p => 
        addedPlaces.some(ap => ap.id === p.id) 
          ? { ...p, isCandidate: true } 
          : p
      ));
      
      // Also update the category-specific selected places
      const updatedSelectedPlacesByCategory = { ...selectedPlacesByCategory };
      
      markedAddedPlaces.forEach(place => {
        const placeCategory = getCategoryKorean(place.category);
        if (placeCategory in updatedSelectedPlacesByCategory) {
          updatedSelectedPlacesByCategory[placeCategory as keyof typeof updatedSelectedPlacesByCategory].push(place);
        }
      });
      
      setSelectedPlacesByCategory(updatedSelectedPlacesByCategory);
      
      // Notify the user about added places
      toast.info(`${category} 카테고리에서 ${addedPlaces.length}개의 추천 장소가 자동으로 추가되었습니다.`);
      
      console.log(`[자동 보완] ${category} 카테고리에 ${addedPlaces.length}개 장소 자동 추가 완료`, 
        addedPlaces.map(p => p.name));
    } else {
      console.log(`[자동 보완] ${category} 카테고리에 추가할 장소가 없습니다.`);
      toast.warning(`${category} 카테고리에 추가할 적합한 추천 장소가 없습니다.`);
    }
  };

  const prepareSchedulePayload = (
    placesToSchedule: Place[], 
    dateTime: { start_datetime: string; end_datetime: string } | null,
    availableRecommendedPlacesByCategory: { [category: string]: Place[] } = {} 
  ): SchedulePayload | null => {
    if (!dateTime) {
      toast.error('여행 날짜와 시간을 선택해주세요');
      return null;
    }

    // Since auto-completion now happens at category confirmation time,
    // we don't need to auto-complete places here anymore
    
    const userSelected: SchedulePlace[] = placesToSchedule
      .filter(p => !p.isCandidate)
      .map(p => ({ id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id, name: p.name }));

    const autoCandidates: SchedulePlace[] = placesToSchedule
      .filter(p => p.isCandidate)
      .map(p => ({ id: typeof p.id === 'string' ? parseInt(p.id, 10) : p.id, name: p.name }));

    console.log('[일정 생성] 일정 생성 데이터 (prepareSchedulePayload):', {
      사용자선택_장소수: userSelected.length,
      자동후보_장소수: autoCandidates.length,
      총_장소수: placesToSchedule.length,
      날짜: dateTime,
      payload_selected: userSelected.map(p => p.name),
      payload_candidates: autoCandidates.map(p => p.name),
    });

    // 서버 요청 페이로드 디버깅 로그
    const payload = {
      selected_places: userSelected,
      candidate_places: autoCandidates,
      ...dateTime
    };
    
    console.log("[일정 생성] 서버 요청 페이로드:", JSON.stringify(payload, null, 2));

    return payload;
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
    handleAutoCompletePlaces
  };
};
