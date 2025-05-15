import { useState, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  setAccommodationKeywords,
  setLandmarkKeywords,
  setRestaurantKeywords,
  setCafeKeywords,
  setCategoryPanelOpen,
} from '@/store/slices/keywordSlice';
import { CategoryName } from '@/types/category';
import { SchedulePayload } from '@/types/schedule';
import { ItineraryDay } from '@/types/itinerary';
import { useScheduleGenerator } from './use-schedule-generator';
import { createItinerary } from '@/api/itinerary';

export const useLeftPanel = ({ onItineraryCreated }: { onItineraryCreated: (itinerary: ItineraryDay[]) => void }) => {
  const dispatch = useAppDispatch();
  const selectedPlaces = useAppSelector((state) => state.place.selectedPlaces);
  const candidatePlaces = useAppSelector((state) => state.place.candidatePlaces);

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
      setAccommodationDirectInputValue(value as any);
    } else if (category === 'landmark') {
      setLandmarkDirectInputValue(value as any);
    } else if (category === 'restaurant') {
      setRestaurantDirectInputValue(value as any);
    } else if (category === 'cafe') {
      setCafeDirectInputValue(value as any);
    }
  };

  const createItineraryWrapper = (payload: SchedulePayload): Promise<ItineraryDay[]> => {
    const { selectedPlaces, candidatePlaces, startDate, endDate } = payload;
    const placesToUse = [...selectedPlaces, ...candidatePlaces];
    const startTime = "09:00";
    const endTime = "21:00";
    
    // Convert to Promise to match expected type
    return Promise.resolve(
      createItinerary(placesToUse, startDate, endDate, startTime, endTime)
    );
  };

  useScheduleGenerator({
    selectedPlaces,
    candidatePlaces,
    createItinerary: createItineraryWrapper,
    onItineraryCreated,
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
  };
};
