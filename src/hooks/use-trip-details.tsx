
import { useState, useMemo } from 'react';

interface TripDetails {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

export const useTripDetails = () => {
  const [details, setDetails] = useState<TripDetails>({
    startDate: null,
    endDate: null,
    startTime: '10:00',
    endTime: '22:00',
  });

  // 여행 기간 계산 (n박)
  const tripDuration = useMemo(() => {
    if (!details.startDate || !details.endDate) return null;
    
    // 날짜 차이 계산 (밀리초 -> 일)
    const diffTime = details.endDate.getTime() - details.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // 총 박수 계산 (1일 여행이면 0박, 2일 여행이면 1박, ...)
    return Math.max(0, diffDays);
  }, [details.startDate, details.endDate]);

  const setStartDate = (date: Date | null) => {
    setDetails((prev) => ({ ...prev, startDate: date }));
  };

  const setEndDate = (date: Date | null) => {
    setDetails((prev) => ({ ...prev, endDate: date }));
  };

  const setStartTime = (time: string) => {
    setDetails((prev) => ({ ...prev, startTime: time }));
  };

  const setEndTime = (time: string) => {
    setDetails((prev) => ({ ...prev, endTime: time }));
  };

  // Add a function to set all dates at once
  const setDates = (dates: TripDetails) => {
    setDetails(dates);
  };

  // Adding direct input state that's referenced in use-left-panel.tsx
  const [accomodationDirectInput, setAccomodationDirectInput] = useState('');
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  return {
    startDate: details.startDate,
    endDate: details.endDate,
    startTime: details.startTime,
    endTime: details.endTime,
    tripDuration,
    setStartDate,
    setEndDate,
    setStartTime,
    setEndTime,
    setDates,
    // For use in use-left-panel.tsx
    dates: details,
    accomodationDirectInput,
    setAccomodationDirectInput,
    landmarkDirectInput,
    setLandmarkDirectInput,
    restaurantDirectInput,
    setRestaurantDirectInput,
    cafeDirectInput,
    setCafeDirectInput,
  };
};
