
import { useState, useMemo } from 'react';
import { format } from 'date-fns';

interface TripDetails {
  startDate: Date | null;
  endDate: Date | null;
  startTime: string;
  endTime: string;
}

// Utility function to format date and time into "YYYY-MM-DDTHH:mm:ss"
const formatLocalDateTime = (date: Date | null, time: string): string | null => {
  if (!date || !time) return null;
  if (typeof time !== 'string') {
    console.warn(`[formatLocalDateTime] Invalid time value: ${time}. Expected string.`);
    return null;
  }
  const parts = time.split(':');
  if (parts.length !== 2) {
    console.warn(`[formatLocalDateTime] Invalid time format: ${time}. Expected HH:MM.`);
    return null;
  }
  // Use date-fns format to construct the string directly
  // This avoids issues with Date object's internal timezone handling and toISOString()
  try {
    const [hours, minutes] = parts.map(Number);
    const dateWithTime = new Date(date);
    dateWithTime.setHours(hours, minutes, 0, 0); // Set time locally
    return format(dateWithTime, "yyyy-MM-dd'T'HH:mm:ss");
  } catch (error) {
    console.error(`[formatLocalDateTime] Error formatting date-time:`, error);
    return null;
  }
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

  // startDatetime and endDatetime are still ISO for compatibility with payload if needed,
  // but we'll introduce local versions for direct use.
  const startDatetimeISO = useMemo(() => {
    if (!details.startDate || !details.startTime) return null;
    const [hh, mm] = details.startTime.split(':');
    const d = new Date(details.startDate);
    d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    return d.toISOString();
  }, [details.startDate, details.startTime]);

  const endDatetimeISO = useMemo(() => {
    if (!details.endDate || !details.endTime) return null;
    const [hh, mm] = details.endTime.split(':');
    const d = new Date(details.endDate);
    d.setHours(parseInt(hh, 10), parseInt(mm, 10), 0, 0);
    return d.toISOString();
  }, [details.endDate, details.endTime]);

  // New local formatted date-time strings
  const startDatetimeLocal = useMemo(() => formatLocalDateTime(details.startDate, details.startTime), [details.startDate, details.startTime]);
  const endDatetimeLocal = useMemo(() => formatLocalDateTime(details.endDate, details.endTime), [details.endDate, details.endTime]);


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
    startDatetime: startDatetimeISO, // Keep original ISO for now if anything relies on it
    endDatetime: endDatetimeISO,   // Keep original ISO for now
    startDatetimeLocal, // Export new local formatted string
    endDatetimeLocal,   // Export new local formatted string
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
