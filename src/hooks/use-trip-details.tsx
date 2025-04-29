
import { useState } from 'react';
import { format } from 'date-fns';

export interface TripDates {
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
}

export const useTripDetails = () => {
  const [dates, setDates] = useState<TripDates | null>(null);
  const [accomodationDirectInput, setAccomodationDirectInput] = useState('');
  const [landmarkDirectInput, setLandmarkDirectInput] = useState('');
  const [restaurantDirectInput, setRestaurantDirectInput] = useState('');
  const [cafeDirectInput, setCafeDirectInput] = useState('');

  const formatToISOString = (date: Date, time: string): string => {
    const [hours, minutes] = time.split(':');
    const newDate = new Date(date);
    newDate.setHours(Number(hours), Number(minutes), 0);
    return newDate.toISOString();
  };

  const buildScheduleDateTime = () => {
    if (!dates) return null;
    
    return {
      start_datetime: formatToISOString(dates.startDate, dates.startTime),
      end_datetime: formatToISOString(dates.endDate, dates.endTime)
    };
  };

  const buildPromptKeywords = () => {
    const allKeywords: string[] = [];

    if (dates) {
      const formattedStartDate = format(dates.startDate, 'MM.dd');
      const formattedEndDate = format(dates.endDate, 'MM.dd');
      allKeywords.push(`일정[${formattedStartDate},${dates.startTime},${formattedEndDate},${dates.endTime}]`);
    }

    return allKeywords;
  };

  return {
    dates,
    setDates,
    buildScheduleDateTime,
    accomodationDirectInput,
    setAccomodationDirectInput,
    landmarkDirectInput,
    setLandmarkDirectInput,
    restaurantDirectInput,
    setRestaurantDirectInput,
    cafeDirectInput,
    setCafeDirectInput,
    buildPromptKeywords
  };
};
