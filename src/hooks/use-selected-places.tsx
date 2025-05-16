import { useState, useCallback, useMemo, useEffect } from 'react';
import { Place, SelectedPlace, SchedulePlace, SchedulePayload as LocalSchedulePayload } from '@/types/supabase';
import { CategoryName, CATEGORIES, MINIMUM_RECOMMENDATION_COUNT } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { sortByWeightDescending } from '@/lib/utils';
import { useTripDetails } from './use-trip-details';

export const useSelectedPlaces = () => {
  const { tripDuration } = useTripDetails();
  const [selectedPlaces, setSelectedPlaces] = useState<SelectedPlace[]>([]);
  const [candidatePlaces, setCandidatePlaces] = useState<SelectedPlace[]>([]);

  const selectedPlacesByCategory = useMemo(() => {
    const grouped: Record<CategoryName, SelectedPlace[]> = {
      '숙소': [],
      '관광지': [],
      '음식점': [],
      '카페': [],
    };
    selectedPlaces.forEach(place => {
      if (place.category && CATEGORIES.includes(place.category as CategoryName)) {
        grouped[place.category as CategoryName].push(place);
      }
    });
    return grouped;
  }, [selectedPlaces]);

  const handleSelectPlace = useCallback((place: Place, checked: boolean, categoryOverride?: CategoryName) => {
    const placeCategory = categoryOverride || place.category as CategoryName;
    
    if (!placeCategory || !CATEGORIES.includes(placeCategory)) {
        console.warn(`[장소 선택] 유효하지 않은 카테고리 (${placeCategory}) 또는 장소 정보 부족:`, place);
        toast.error("장소 정보에 오류가 있어 선택할 수 없습니다.");
        return;
    }

    setSelectedPlaces(prev => {
      const newSelectedPlace: SelectedPlace = {
        ...place,
        category: placeCategory,
        isSelected: checked,
        isCandidate: false, // User-selected places are not candidates by default
      };

      if (checked) {
        if (placeCategory === '숙소') {
          const currentAccommodations = prev.filter(p => p.category === '숙소');
          const maxAccommodations = tripDuration !== null && tripDuration >= 0 ? Math.max(tripDuration, 1) : 1;
          
          if (currentAccommodations.length >= maxAccommodations) {
            toast.info(`숙소는 최대 ${maxAccommodations}개까지 선택할 수 있습니��. 기존 숙소를 변경하려면 먼저 삭제해주세요.`);
            return prev; 
          }
        }
        return [...prev, newSelectedPlace];
      } else {
        return prev.filter(p => p.id !== place.id);
      }
    });
  }, [tripDuration]);

  const handleRemovePlace = useCallback((id: string | number) => {
    setSelectedPlaces(prev => prev.filter(place => place.id !== id));
    setCandidatePlaces(prev => prev.filter(place => place.id !== id)); // Also remove from candidates if it was there
  }, []);

  const handleViewOnMap = useCallback((place: Place) => {
    console.log("지도에서 보기:", place);
  }, []);

  const allCategoriesSelected = useMemo(() => {
    return CATEGORIES.every(category => {
      const placesInCat = selectedPlacesByCategory[category] || [];
      return placesInCat.length > 0;
    });
  }, [selectedPlacesByCategory]);

  const isAccommodationLimitReached = useMemo(() => {
    const maxAccommodations = tripDuration !== null && tripDuration >= 0 ? Math.max(tripDuration, 1) : 1;
    return (selectedPlacesByCategory['숙소']?.length || 0) >= maxAccommodations;
  }, [selectedPlacesByCategory, tripDuration]);
  
  const handleAutoCompletePlaces = useCallback(
    (
      category: CategoryName,
      recommendedPool: Place[],
      travelDays: number | null
    ) => {
      let currentTravelDays = travelDays;
      if (currentTravelDays === null && tripDuration !== null && tripDuration >= 0) {
        currentTravelDays = tripDuration + 1;
      }

      console.log(
        `[자동 보완 시작] 카테고리: ${category}, 총 여행일수: ${currentTravelDays}, 추천 풀 크기: ${recommendedPool.length}`
      );

      if (currentTravelDays === null || currentTravelDays <= 0) {
        console.warn(`[자동 보완] 유효한 여행 기간(총 ${currentTravelDays}일)이 없어 자동 보완을 실행할 수 없습니다. 카테고리: ${category}`);
        toast.error("여행 기간 정보가 올바르지 않아 장소를 자동 보완할 수 없습니다. 날짜를 확인해주세요.");
        return;
      }
      
      const minCountConfig = MINIMUM_RECOMMENDATION_COUNT(currentTravelDays);
      const minimumCountForCategory = minCountConfig[category];
      const currentSelectedInCategory = selectedPlacesByCategory[category]?.length || 0; // Based on user-selected places
      
      let shortfall = Math.max(0, minimumCountForCategory - currentSelectedInCategory);
      console.log(`[자동 보완] ${category}: 최소 필요 ${minimumCountForCategory}개, 현재 선택 ${currentSelectedInCategory}개, 부족분 ${shortfall}개`);

      if (category === '숙소') {
        console.log('[자동 보완] 숙소는 자동 보완을 하지 않습니다. 사용자가 선택한 숙소만 포함됩니다.');
        const maxAccommodations = tripDuration !== null && tripDuration >= 0 ? Math.max(tripDuration, 1) : 1;
        if (currentSelectedInCategory < maxAccommodations) {
             toast.warning(`숙소는 ${maxAccommodations}개가 필요합니다. 현재 ${currentSelectedInCategory}개가 선택되어 있습니다.`);
        } else if (currentSelectedInCategory > maxAccommodations) {
             toast.error(`숙소 선택 개수(${currentSelectedInCategory}개)가 최대 허용치(${maxAccommodations}개)를 초과했습니다.`);
        } else {
            toast.success(`${category} 선택 완료!`);
        }
        return;
      }

      if (shortfall === 0) {
        console.log(`[자동 보완] ${category}: 이미 최소 개수(${minimumCountForCategory}개)를 충족하여 추가 보완하지 않습니다.`);
        toast.success(`${category} 선택 완료!`);
        return;
      }

      // Consider IDs from both selectedPlaces (user picked) and existing candidatePlaces to avoid duplicates
      const allCurrentlySelectedOrCandidateIds = new Set([
        ...selectedPlaces.map(p => p.id),
        ...candidatePlaces.map(p => p.id)
      ]);

      const availableToRecommend = sortByWeightDescending(
        recommendedPool.filter(p => !allCurrentlySelectedOrCandidateIds.has(p.id))
      );
      
      console.log(`[자동 보완] ${category}: 추천 풀에서 선택 가능한 장소 ${availableToRecommend.length}개`);

      const placesToAutoAddAsCandidates: Place[] = [];
      for (const place of availableToRecommend) {
        if (shortfall === 0) break;
        placesToAutoAddAsCandidates.push(place);
        shortfall--;
      }
      
      if (placesToAutoAddAsCandidates.length > 0) {
        const newCandidatesToAddState = placesToAutoAddAsCandidates.map(place => ({
          ...place,
          category: category, 
          isSelected: true, // Retain for consistency if prepareSchedulePayload expects it from combined list
          isCandidate: true
        }));
        
        setCandidatePlaces(prevCandidates => {
          const newCandidateIds = new Set(newCandidatesToAddState.map(p => p.id));
          // Filter out any pre-existing candidates that are part of the new batch to avoid duplicates
          const filteredPrevCandidates = prevCandidates.filter(p => !newCandidateIds.has(p.id));
          return [...filteredPrevCandidates, ...newCandidatesToAddState];
        });
        
        // DO NOT add to selectedPlaces state anymore.
        // setSelectedPlaces(prevSelected => {
        //     const existingIds = new Set(prevSelected.map(p => p.id));
        //     const uniqueAutoAdded = newCandidatesToAddState.filter(p => !existingIds.has(p.id));
        //     return [...prevSelected, ...uniqueAutoAdded];
        // });

        toast.success(`${category}: ${placesToAutoAddAsCandidates.length}개의 장소가 자동으로 추천 목록에 추가되었습니다.`);
        console.log(`[자동 보완] ${category}: ${placesToAutoAddAsCandidates.length}개 장소 자동 추가 완료 (후보 목록에만).`);
      } else if (shortfall > 0) {
        toast.error(`${category}: 추천할 장소가 부족하여 ${shortfall}개를 더 채우지 못했습니다.`);
        console.log(`[자동 보완] ${category}: 추천 장소 부족으로 ${shortfall}개 미보완.`);
      } else {
         toast.success(`${category} 선택 완료!`);
      }
    },
    [selectedPlacesByCategory, selectedPlaces, candidatePlaces, tripDuration] 
  );
  
  const prepareSchedulePayload = (
    // This argument will be the user-selected places from the selectedPlaces state hook
    userSelectedPlacesInput: SelectedPlace[], 
    tripDateTime: { startDate: Date; endDate: Date; startTime: string; endTime: string },
  ): LocalSchedulePayload => {
    const { startDate, endDate, startTime, endTime } = tripDateTime;
    
    // userSelectedPlacesInput are the places explicitly selected by the user.
    // candidatePlaces (from the hook's state) are the auto-completed ones.
    
    const selectedPlacesForPayload: SchedulePlace[] = userSelectedPlacesInput.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id,
      name: p.name || 'Unknown Place'
    }));
    
    // Use the candidatePlaces state directly from the hook for candidate places.
    const candidatePlacesForPayload: SchedulePlace[] = candidatePlaces.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id,
      name: p.name || 'Unknown Place'
    }));
    
    const formatDateWithTime = (date: Date, timeStr: string | undefined): string => {
      let resolvedTimeStr = timeStr;
      if (!resolvedTimeStr) {
        console.warn(`[일정 생성] 시간 정보(startTime/endTime)가 누락되어 기본값 '10:00'을 사용합니다. 날짜: ${date.toISOString().split('T')[0]}`);
        resolvedTimeStr = '10:00'; // Fallback for missing time
      }
      
      const [hours, minutes] = resolvedTimeStr.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate.toISOString();
    };
    
    const payload: LocalSchedulePayload = {
      selected_places: selectedPlacesForPayload,
      candidate_places: candidatePlacesForPayload,
      start_datetime: formatDateWithTime(startDate, startTime),
      end_datetime: formatDateWithTime(endDate, endTime)
    };

    console.log("[일정 생성] 최종 Payload 준비:", JSON.stringify(payload, null, 2));
    return payload;
  };

  useEffect(() => {
    console.log("[SelectedPlaces Hook] 선택된 장소 변경됨 (사용자 선택):", selectedPlaces);
    console.log("[SelectedPlaces Hook] 후보 장소 변경됨 (자동 보완):", candidatePlaces);
    console.log("[SelectedPlaces Hook] 현재 여행 기간(박):", tripDuration);
  }, [selectedPlaces, candidatePlaces, tripDuration]);


  return {
    selectedPlaces,
    candidatePlaces,
    selectedPlacesByCategory,
    handleSelectPlace,
    handleRemovePlace,
    handleViewOnMap,
    allCategoriesSelected,
    isAccommodationLimitReached,
    handleAutoCompletePlaces,
    prepareSchedulePayload,
    setCandidatePlaces,
    setSelectedPlaces
  };
};
