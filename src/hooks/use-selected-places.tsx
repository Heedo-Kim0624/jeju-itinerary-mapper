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

  // 후보 장소 자동 보완 기능 - 개선된 버전
  const autoCompleteWithCandidates = (
    currentSelectedPlaces: Place[], 
    recommendedPlacesByCategory: { [category: string]: Place[] }, 
    currentTripDuration: number
  ): Place[] => {
    console.log("[자동 보완] autoCompleteWithCandidates 함수 호출됨", {
      여행일수: currentTripDuration,
      선택된_장소_수: currentSelectedPlaces.length,
      추천_카테고리_목록: Object.keys(recommendedPlacesByCategory)
    });
    
    // 각 카테고리별 추천 가능 장소 개수 출력
    Object.entries(recommendedPlacesByCategory).forEach(([category, places]) => {
      console.log(`[자동 보완] ${category} 카테고리 추천 후보 장소: ${places.length}개`);
    });

    if (!currentTripDuration || currentTripDuration < 1) {
      console.warn('[자동 보완] 여행 기간 정보가 없어 후보 장소를 자동 보완할 수 없습니다.');
      return currentSelectedPlaces;
    }
    
    const minimumRequirements = getMinimumRecommendationCount(currentTripDuration);
    console.log('[자동 보완] 카테고리별 최소 필요 장소 수:', minimumRequirements);
    
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

    // 현재 선택된 장소 ID를 Set으로 빠른 조회를 위해 준비
    const selectedPlaceIds = new Set(currentSelectedPlaces.map(place => place.id));
    
    const currentSelectedCountsByKoreanCategory: Record<string, Place[]> = {
      '숙소': [], '관광지': [], '음식점': [], '카페': []
    };
    
    // 선택된 장소를 카테고리별로 분류하고 로그 출력
    currentSelectedPlaces.forEach(place => {
      const koreanCategory = getCategoryKorean(place.category);
      if (koreanCategory && currentSelectedCountsByKoreanCategory[koreanCategory]) {
        currentSelectedCountsByKoreanCategory[koreanCategory].push(place);
      }
    });
    
    console.log('[자동 보완] 현재 카테고리별 선택된 장소:', {
      숙소: currentSelectedCountsByKoreanCategory['숙소'].length,
      관광지: currentSelectedCountsByKoreanCategory['관광지'].length,
      음식점: currentSelectedCountsByKoreanCategory['음식점'].length,
      카페: currentSelectedCountsByKoreanCategory['카페'].length,
      총장소수: currentSelectedPlaces.length
    });
    
    const finalPlaces: Place[] = [...currentSelectedPlaces];
    const autoCompletedCandidatePlaces: Place[] = [];
    const missingCategoryWarnings: string[] = [];
    
    // Iterate using English category keys from minimumRequirements
    Object.entries(minimumRequirements).forEach(([categoryEng, minCount]) => {
      const categoryKorean = categoryEngToKorMapping[categoryEng];
      if (!categoryKorean) {
        console.warn(`[자동 보완] 알 수 없는 카테고리: ${categoryEng}`);
        return;
      }

      const currentCount = currentSelectedCountsByKoreanCategory[categoryKorean]?.length || 0;
      const shortage = Math.max(0, minCount - currentCount);
      
      console.log(`[자동 보완] ${categoryKorean} (${categoryEng}) 카테고리: 현재 ${currentCount}개, 최소 ${minCount}개, 부족 ${shortage}개`);

      if (shortage > 0) {
        // 이 카테고리에 대한 추천 장소 배열 가져오기
        let availableRecommended = recommendedPlacesByCategory[categoryKorean] || [];
        
        console.log(`[자동 보완] ${categoryKorean} 카테고리 추천 후보 풀:`, 
          availableRecommended.length > 0 
            ? availableRecommended.slice(0, 5).map(p => ({name: p.name, id: p.id})) + `${availableRecommended.length > 5 ? ' 외 ' + (availableRecommended.length - 5) + '개' : ''}`
            : '없음'
        );

        // 이미 선택된 장소 제외 (중복 방지)
        availableRecommended = availableRecommended
          .filter(rp => !selectedPlaceIds.has(rp.id) && 
                        !autoCompletedCandidatePlaces.some(acp => acp.id === rp.id));
        
        // 후보가 부족하면 경고 추가
        if (availableRecommended.length < shortage) {
          missingCategoryWarnings.push(`${categoryKorean} 카테고리는 ${shortage}개가 부족하지만, 추가할 수 있는 추천 장소는 ${availableRecommended.length}개뿐입니다.`);
        }
          
        const candidatesToAdd = availableRecommended.slice(0, shortage);
          
        if (candidatesToAdd.length > 0) {
          console.log(`[자동 보완] ${categoryKorean} 카테고리에 ${candidatesToAdd.length}개 장소 자동 추가:`, 
            candidatesToAdd.map(p => p.name));
          
          const markedCandidates = candidatesToAdd.map(p => ({
            ...p,
            isCandidate: true 
          }));
          
          finalPlaces.push(...markedCandidates);
          autoCompletedCandidatePlaces.push(...markedCandidates);
        } else {
          console.warn(`[자동 보완] ${categoryKorean} 카테고리의 추천 장소가 부족하거나 이미 선택된 장소입니다. (부족분: ${shortage}, 사용가능 추천: ${availableRecommended.length})`);
          
          // 부족한 카테고리에 대한 경고 메시지
          missingCategoryWarnings.push(`${categoryKorean} 카테고리에 ${shortage}개 장소가 부족합니다.`);
        }
      }
    });
    
    // 최종 결과 로그 출력
    if (autoCompletedCandidatePlaces.length > 0) {
      console.log(`[자동 보완 완료] 총 ${autoCompletedCandidatePlaces.length}개의 장소를 자동으로 추가했습니다.`, 
        autoCompletedCandidatePlaces.map(p => `${p.name} (${getCategoryKorean(p.category)})`));
        
      // 최종 선택 장소와 카테고리별 통계 출력
      const finalCounts = {
        '숙소': 0, '관광지': 0, '음식점': 0, '카페': 0, '기타': 0
      };
      
      finalPlaces.forEach(place => {
        const category = getCategoryKorean(place.category);
        if (category && finalCounts[category as keyof typeof finalCounts] !== undefined) {
          finalCounts[category as keyof typeof finalCounts]++;
        } else {
          finalCounts['기타']++;
        }
      });
      
      console.log('[자동 보완 완료] 최종 카테고리별 장소 수:', finalCounts);
      
      // 후보 목록에 추가
      setCandidatePlaces(prev => [...prev, ...autoCompletedCandidatePlaces.filter(acp => !prev.some(p => p.id === acp.id))]);
      
      // 사용자에게 알림
      toast.info(`${autoCompletedCandidatePlaces.length}개의 추천 장소가 자동으로 추가되었습니다.`);
      
      // 부족한 장소 카테고리가 있다면 경고 메시지 표시
      if (missingCategoryWarnings.length > 0) {
        toast.warning(`일부 카테고리에 필요한 장소가 부족합니다. ${missingCategoryWarnings.join(' ')}`);
      }
    } else {
      console.log('[자동 보완] 추가된 자동 추천 장소가 없습니다.');
      
      // 전체적으로 부족한 경우 경고 메시지 표시
      if (missingCategoryWarnings.length > 0) {
        toast.warning(`추천 장소가 부족합니다: ${missingCategoryWarnings.join(' ')}`);
      }
    }
    
    return finalPlaces;
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

    const startDate = new Date(dateTime.start_datetime);
    const endDate = new Date(dateTime.end_datetime);
    const tripDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    console.log("[일정 생성] 일정 생성 전 장소 자동 보완 시작", {
      선택된_장소_수: placesToSchedule.length, 
      여행_일수: tripDays
    });
    
    // autoCompleteWithCandidates expects KOREAN category names as keys
    const enrichedPlaces = autoCompleteWithCandidates(placesToSchedule, availableRecommendedPlacesByCategory, tripDays);

    const userSelected: SelectedPlace[] = enrichedPlaces
      .filter(p => !p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    const autoCandidates: SelectedPlace[] = enrichedPlaces
      .filter(p => p.isCandidate)
      .map(p => ({ id: p.id, name: p.name }));

    console.log('[일정 생성] 일정 생성 데이터 (prepareSchedulePayload):', {
      사용자선택_장소수: userSelected.length,
      자동후보_장소수: autoCandidates.length,
      총_장소수: enrichedPlaces.length,
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
    autoCompleteWithCandidates
  };
};
