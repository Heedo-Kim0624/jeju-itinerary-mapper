
import { useState } from 'react';
import { format } from 'date-fns';

interface TripDates {
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
