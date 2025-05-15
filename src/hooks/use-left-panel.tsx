import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setAccommodationKeywords,
  setLandmarkKeywords,
  setRestaurantKeywords,
  setCafeKeywords,
  setCategoryPanelOpen,
} from '@/store/slices/keywordSlice';
import { CategoryName } from '@/utils/categoryUtils';
import { SchedulePayload } from '@/types/schedule';
import { ItineraryDay, Place, SelectedPlace } from '@/types/supabase';
import { useScheduleGenerator } from './use-schedule-generator';
import { createItinerary as apiCreateItinerary } from '@/api/itinerary';

export const useLeftPanel = ({ onItineraryCreated }: { onItineraryCreated: (itinerary: ItineraryDay[]) => void }) => {
  const dispatch = useAppDispatch();
  const selectedPlacesFromStore = useAppSelector((state) => state.place.selectedPlaces as Place[]);
  const candidatePlacesFromStore = useAppSelector((state) => state.place.candidatePlaces as Place[]);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const [accommodationDirectInputValue, setAccommodationDirectInputValue] = useState('');
  const [landmarkDirectInputValue, setLandmarkDirectInputValue] = useState('');
  const [restaurantDirectInputValue, setRestaurantDirectInputValue] = useState('');
  const [cafeDirectInputValue, setCafeDirectInputValue] = useState('');

  const confirmAccommodationKeywords = useCallback(
    (keywords: string[], clearSelection: boolean = false) => {
      dispatch(setAccommodationKeywords({ keywords, clearSelection }));
    },
    [dispatch]
  );

  const confirmLandmarkKeywords = useCallback(
    (keywords: string[], clearSelection: boolean = false) => {
      dispatch(setLandmarkKeywords({ keywords, clearSelection }));
    },
    [dispatch]
  );

  const confirmRestaurantKeywords = useCallback(
    (keywords: string[], clearSelection: boolean = false) => {
      dispatch(setRestaurantKeywords({ keywords, clearSelection }));
    },
    [dispatch]
  );

  const confirmCafeKeywords = useCallback(
    (keywords: string[], clearSelection: boolean = false) => {
      dispatch(setCafeKeywords({ keywords, clearSelection }));
    },
    [dispatch]
  );

  const closeAccommodationPanel = useCallback(() => {
    dispatch(setCategoryPanelOpen({ category: 'accommodation', open: false }));
  }, [dispatch]);

  const closeLandmarkPanel = useCallback(() => {
    dispatch(setCategoryPanelOpen({ category: 'landmark', open: false }));
  }, [dispatch]);

  const closeRestaurantPanel = useCallback(() => {
    dispatch(setCategoryPanelOpen({ category: 'restaurant', open: false }));
  }, [dispatch]);

  const closeCafePanel = useCallback(() => {
    dispatch(setCategoryPanelOpen({ category: 'cafe', open: false }));
  }, [dispatch]);

  const setCategoryKeyword = (category: CategoryName) => (value: string) => {
    if (category === 'accommodation') {
      setAccommodationDirectInputValue(value);
    } else if (category === 'landmark' || category === 'attraction') {
      setLandmarkDirectInputValue(value);
    } else if (category === 'restaurant') {
      setRestaurantDirectInputValue(value);
    } else if (category === 'cafe') {
      setCafeDirectInputValue(value);
    }
  };

  const createItineraryWrapper = useCallback(async (payload: SchedulePayload): Promise<ItineraryDay[]> => {
    if (!payload.start_datetime || !payload.end_datetime) {
      toast.error("Date information is missing in payload for itinerary generation.");
      return Promise.reject(new Error("Date information is missing"));
    }
    const sDate = new Date(payload.start_datetime);
    const eDate = new Date(payload.end_datetime);
    
    const localItineraryDays: ItineraryDay[] = [];
    let currentDate = new Date(sDate);
    while (currentDate <= eDate) {
      localItineraryDays.push({
        id: currentDate.toISOString().split('T')[0], 
        date: currentDate.toISOString(), 
        places: [], 
        user_id: '', 
        trip_id: '', 
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
    return Promise.resolve(localItineraryDays);
  }, []);

  useScheduleGenerator({
    selectedPlaces: selectedPlacesFromStore,
    candidatePlaces: candidatePlacesFromStore,
    createItinerary: createItineraryWrapper,
    onItineraryCreated,
    startDate,
    endDate,
  });

  return {
    accommodationDirectInputValue,
    landmarkDirectInputValue,
    restaurantDirectInputValue,
    cafeDirectInputValue,
    setAccommodationDirectInputValue,
    setLandmarkDirectInputValue,
    setRestaurantDirectInputValue,
    setCafeDirectInputValue,
    confirmAccommodationKeywords,
    confirmLandmarkKeywords,
    confirmRestaurantKeywords,
    confirmCafeKeywords,
    closeAccommodationPanel,
    closeLandmarkPanel,
    closeRestaurantPanel,
    closeCafePanel,
    setCategoryKeyword,
    setStartDate,
    setEndDate,
  };
};
