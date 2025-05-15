
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Place } from '@/types/supabase';

interface TripContextType {
  selectedPlaces: Place[];
  setSelectedPlaces: React.Dispatch<React.SetStateAction<Place[]>>;
  dates: {
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  };
  setDates: React.Dispatch<React.SetStateAction<{
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  }>>;
}

const defaultContext: TripContextType = {
  selectedPlaces: [],
  setSelectedPlaces: () => {},
  dates: {},
  setDates: () => {}
};

const TripContext = createContext<TripContextType>(defaultContext);

export const useTripContext = () => useContext(TripContext);

interface TripProviderProps {
  children: ReactNode;
}

export const TripProvider: React.FC<TripProviderProps> = ({ children }) => {
  const [selectedPlaces, setSelectedPlaces] = useState<Place[]>([]);
  const [dates, setDates] = useState<{
    startDate?: string;
    endDate?: string;
    startTime?: string;
    endTime?: string;
  }>({});

  return (
    <TripContext.Provider value={{
      selectedPlaces,
      setSelectedPlaces,
      dates,
      setDates
    }}>
      {children}
    </TripContext.Provider>
  );
};

export default TripContext;
