
import { useCallback } from 'react';
import { SelectedPlace } from '@/types/supabase';
import { SchedulePayload } from '@/types/schedule'; // Ensure this is the correct SchedulePayload

interface UseSchedulePayloadProps {
  selectedPlaces: SelectedPlace[];
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
  // Optional: start/end location if you have them
  startLocationName?: string; 
  endLocationName?: string;
}

export const useSchedulePayload = ({
  selectedPlaces,
  startDatetimeISO,
  endDatetimeISO,
  startLocationName = "제주국제공항", // Default start location
  endLocationName = "제주국제공항",   // Default end location
}: UseSchedulePayloadProps) => {
  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      console.error('[useSchedulePayload] Start or end datetime is missing.');
      return null;
    }

    if (selectedPlaces.length === 0) {
      console.warn('[useSchedulePayload] No places selected.');
      // Depending on logic, might still want to generate payload for server to handle empty places
    }

    const placesForPayload = selectedPlaces.map(p => ({
      id: p.id?.toString() || '', // Ensure id is string
      name: p.name,
      category: p.category, // This should be the internal category string like 'restaurant'
      x: p.x || 0,
      y: p.y || 0,
      address: p.address || '',
      // place_type is important for the server
      place_type: p.category, // Assuming p.category is the same as place_type server expects
      isRequired: p.isRequired === undefined ? true : p.isRequired, // Default to true
    }));

    return {
      start_timestamp: startDatetimeISO,
      end_timestamp: endDatetimeISO,
      start_location: startLocationName,
      end_location: endLocationName,
      places: placesForPayload, // Correct field name
    };
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO, startLocationName, endLocationName]);

  return { preparePayload };
};
