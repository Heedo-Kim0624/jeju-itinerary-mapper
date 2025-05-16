
import { useState, useMemo } from 'react';

interface TripDetails {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

// Utility function to format date and time into an ISO string
const formatDateTime = (date: Date | null, time: string): string | null => {
  if (!date || !time) return null;
  // Ensure time is a string before splitting
  if (typeof time !== 'string') {
    console.warn(`[formatDateTime] Invalid time value: ${time}. Expected string.`);
    return null; 
  }
  const parts = time.split(':');
  if (parts.length !== 2) {
    console.warn(`[formatDateTime] Invalid time format: ${time}. Expected HH:MM.`);
    return null;
  }
  const [hh, mm] = parts;
  const withTime = new Date(date);
  withTime.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
  return withTime.toISOString();
};

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
    
    const diffTime = details.endDate.getTime() - details.startDate.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }, [details.startDate, details.endDate]);

  const startDatetime = useMemo(() => formatDateTime(details.startDate, details.startTime), [details.startDate, details.startTime]);
  const endDatetime = useMemo(() => formatDateTime(details.endDate, details.endTime), [details.endDate, details.endTime]);

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
    dates: details,
    startDatetime, // Export new ISO string
    endDatetime,   // Export new ISO string
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

