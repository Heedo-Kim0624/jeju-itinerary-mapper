import { useState, useCallback, useMemo, useEffect } from 'react';
import { Place, SchedulePayload, SelectedPlace } from '@/types/supabase';
import { CategoryName, CATEGORIES, MINIMUM_RECOMMENDATION_COUNT } from '@/utils/categoryUtils';
import { toast } from 'sonner';
import { sortByWeightDescending } from '@/lib/utils';
import { SchedulePlace } from '@/types/schedule';

export const useSelectedPlaces = () => {
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
    
    // Validate category
    if (!placeCategory || !CATEGORIES.includes(placeCategory)) {
        console.warn(`[장소 선택] 유효하지 않은 카테고리 (${placeCategory}) 또는 장소 정보 부족:`, place);
        toast.error("장소 정보에 오류가 있어 선택할 수 없습니다.");
        return;
    }

    setSelectedPlaces(prev => {
      const newSelectedPlace: SelectedPlace = {
        ...place,
        category: placeCategory, // Ensure category is set
        isSelected: checked,
        isCandidate: false, 
      };

      if (checked) {
        // 숙소 카테고리인 경우, 이미 선택된 숙소가 있는지 확인
        if (placeCategory === '숙소') {
          const existingAccommodation = prev.find(p => p.category === '숙소');
          if (existingAccommodation) {
            toast.info("숙소는 하나만 선택할 수 있습니다. 기존 숙소를 삭제하고 추가합니다.");
            // 기존 숙소 제거 후 새 숙소 추가
            return [...prev.filter(p => p.category !== '숙소'), newSelectedPlace];
          }
        }
        return [...prev, newSelectedPlace];
      } else {
        return prev.filter(p => p.id !== place.id);
      }
    });
  }, []);

  const handleRemovePlace = useCallback((id: string | number) => {
    setSelectedPlaces(prev => prev.filter(place => place.id !== id));
    setCandidatePlaces(prev => prev.filter(place => place.id !== id));
  }, []);

  const handleViewOnMap = useCallback((place: Place) => {
    // This function would typically interact with a map context
    console.log("지도에서 보기:", place);
    // Example: mapContext.panTo(place.latitude, place.longitude);
  }, []);

  const allCategoriesSelected = useMemo(() => {
    return CATEGORIES.every(category => {
      const placesInCat = selectedPlacesByCategory[category] || [];
      return placesInCat.length > 0;
    });
  }, [selectedPlacesByCategory]);

  const isAccommodationLimitReached = useMemo(() => {
    return (selectedPlacesByCategory['숙소']?.length || 0) >= 1;
  }, [selectedPlacesByCategory]);
  
  const handleAutoCompletePlaces = useCallback(
    (
      category: CategoryName,
      recommendedPool: Place[], // 추천 장소 전체 목록
      travelDays: number | null // 총 여행일수 (예: 1일 여행이면 1, 2일 여행이면 2)
    ) => {
      console.log(
        `[자동 보완 시작] 카테고리: ${category}, 총 여행일수: ${travelDays}, 추천 풀 크기: ${recommendedPool.length}`
      );

      if (travelDays === null || travelDays <= 0) {
        console.warn(`[자동 보완] 유효한 여행 기간(총 ${travelDays}일)이 없어 자동 보완을 실행할 수 없습니다. 카테고리: ${category}`);
        toast.error("여행 기간 정보가 올바르지 않아 장소를 자동 보완할 수 없습니다. 날짜를 확인해주세요.");
        return;
      }

      const minCountConfig = MINIMUM_RECOMMENDATION_COUNT(travelDays);
      const minimumCountForCategory = minCountConfig[category];
      const currentSelectedInCategory = selectedPlacesByCategory[category]?.length || 0;
      
      let shortfall = Math.max(0, minimumCountForCategory - currentSelectedInCategory);
      console.log(`[자동 보완] ${category}: 최소 필요 ${minimumCountForCategory}개, 현재 선택 ${currentSelectedInCategory}개, 부족분 ${shortfall}개`);

      // 숙소 카테고리는 자동 보완을 하지 않음 (사용자가 반드시 선택해야 함)
      if (category === '숙소') {
        console.log('[자동 보완] 숙소는 자동 보완을 하지 않습니다. 사용자가 선택한 숙소만 포함됩니다.');
        if (shortfall > 0) {
          toast.warning(`숙소는 ${minimumCountForCategory}개가 필요합니다. 현재 ${currentSelectedInCategory}개가 선택되어 있습니다.`);
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

      // 현재 선택된 장소 ID 목록 (메인 목록 + 후보 목록 모두 포함하여 중복 방지)
      const allCurrentlySelectedIds = new Set([
        ...selectedPlaces.map(p => p.id),
        ...candidatePlaces.map(p => p.id)
      ]);

      // 추천 풀에서 아직 선택되지 않은 장소들 필터링 및 가중치 정렬
      const availableToRecommend = sortByWeightDescending(
        recommendedPool.filter(p => !allCurrentlySelectedIds.has(p.id))
      );
      
      console.log(`[자동 보완] ${category}: 추천 풀에서 선택 가능한 장소 ${availableToRecommend.length}개`);

      const placesToAutoAddAsCandidates: Place[] = [];
      for (const place of availableToRecommend) {
        if (shortfall === 0) break;
        placesToAutoAddAsCandidates.push(place);
        shortfall--;
      }
      
      if (placesToAutoAddAsCandidates.length > 0) {
        const newCandidates = placesToAutoAddAsCandidates.map(place => ({
          ...place,
          category: category, // Assign the correct category
          isSelected: true,
          isCandidate: true
        }));
        
        setCandidatePlaces(prevCandidates => {
          const newCandidateIds = new Set(newCandidates.map(p => p.id));
          // 기존 후보 장소 중 새로 추가될 장소와 ID가 중복되지 않는 것만 유지
          const filteredPrevCandidates = prevCandidates.filter(p => !newCandidateIds.has(p.id));
          return [...filteredPrevCandidates, ...newCandidates];
        });
        
        // 자동 추가된 장소들을 selectedPlaces에도 isCandidate: true로 반영
        setSelectedPlaces(prevSelected => {
            const autoAddedSelectedPlaces = newCandidates;
            // ID 기반으로 중복 제거하면서 합치기
            const existingIds = new Set(prevSelected.map(p => p.id));
            const uniqueAutoAdded = autoAddedSelectedPlaces.filter(p => !existingIds.has(p.id));
            
            return [...prevSelected, ...uniqueAutoAdded];
        });

        toast.success(`${category}: ${placesToAutoAddAsCandidates.length}개의 장소가 자동으로 추천 목록에 추가되었습니다.`);
        console.log(`[자동 보완] ${category}: ${placesToAutoAddAsCandidates.length}개 장소 자동 추가 완료.`);
      } else if (shortfall > 0) {
        toast.error(`${category}: 추천할 장소가 부족하여 ${shortfall}개를 더 채우지 못했습니다.`);
        console.log(`[자동 보완] ${category}: 추천 장소 부족으로 ${shortfall}개 미보완.`);
      } else {
         toast.success(`${category} 선택 완료!`);
      }
    },
    [selectedPlacesByCategory, selectedPlaces, candidatePlaces]
  );
  
  // 수정된 payload 생성 함수: schedule.ts의 SchedulePayload 구조에 맞게 조정
  const prepareSchedulePayload = (
    currentPlaces: SelectedPlace[], // 현재 선택된 장소들 (isCandidate 포함 가능)
    tripDateTime: { startDate: Date; endDate: Date; startTime: string; endTime: string },
  ): SchedulePayload => {
    const { startDate, endDate, startTime, endTime } = tripDateTime;
    
    // 사용자가 선택한 장소와 자동 보완 장소 분리
    const selectedPlaces = currentPlaces.filter(p => !p.isCandidate);
    const candidatePlaces = currentPlaces.filter(p => p.isCandidate);
    
    // 장소 데이터를 SchedulePlace 형식으로 변환 (id, name만 포함)
    const selectedPlacesForPayload: SchedulePlace[] = selectedPlaces.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id,
      name: p.name || 'Unknown Place'
    }));
    
    const candidatePlacesForPayload: SchedulePlace[] = candidatePlaces.map(p => ({
      id: typeof p.id === 'string' ? parseInt(p.id, 10) || p.id : p.id,
      name: p.name || 'Unknown Place'
    }));
    
    // ISO8601 형식의 타임스탬프 생성
    const formatDateWithTime = (date: Date, time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(date);
      newDate.setHours(hours, minutes, 0, 0);
      return newDate.toISOString();
    };
    
    // payload 생성
    const payload: SchedulePayload = {
      selected_places: selectedPlacesForPayload,
      candidate_places: candidatePlacesForPayload,
      start_datetime: formatDateWithTime(startDate, startTime),
      end_datetime: formatDateWithTime(endDate, endTime)
    };

    console.log("[일정 생성] 최종 Payload 준비:", JSON.stringify(payload, null, 2));
    return payload;
  };

  useEffect(() => {
    console.log("[SelectedPlaces Hook] 선택된 장소 변경됨:", selectedPlaces);
    console.log("[SelectedPlaces Hook] 후보 장소 변경됨:", candidatePlaces);
  }, [selectedPlaces, candidatePlaces]);


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
