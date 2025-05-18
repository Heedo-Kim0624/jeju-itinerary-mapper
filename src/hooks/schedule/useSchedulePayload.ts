
import { useCallback } from 'react';
import { SelectedPlace } from '@/types'; // Updated import
import { SchedulePayload } from '@/types'; // Updated import, ensure this is the correct SchedulePayload

interface UseSchedulePayloadProps {
  selectedPlaces: SelectedPlace[];
  startDatetimeISO: string | null;
  endDatetimeISO: string | null;
  startLocationName?: string; 
  endLocationName?: string;
}

export const useSchedulePayload = ({
  selectedPlaces,
  startDatetimeISO,
  endDatetimeISO,
  startLocationName = "제주국제공항",
  endLocationName = "제주국제공항",
}: UseSchedulePayloadProps) => {
  const preparePayload = useCallback((): SchedulePayload | null => {
    if (!startDatetimeISO || !endDatetimeISO) {
      console.error('[useSchedulePayload] Start or end datetime is missing.');
      return null;
    }

    if (selectedPlaces.length === 0) {
      console.warn('[useSchedulePayload] No places selected.');
    }

    const placesForPayload = selectedPlaces.map(p => ({
      id: p.id?.toString() || '', 
      name: p.name,
      category: p.category, 
      x: p.x || 0,
      y: p.y || 0,
      address: p.address || '',
      place_type: p.category, 
      // isRequired is now optional in SelectedPlace, provide default if undefined
      isRequired: p.isRequired === undefined ? true : p.isRequired, 
    }));

    return {
      start_timestamp: startDatetimeISO,
      end_timestamp: endDatetimeISO,
      start_location: startLocationName,
      end_location: endLocationName,
      places: placesForPayload,
    };
  }, [selectedPlaces, startDatetimeISO, endDatetimeISO, startLocationName, endLocationName]);

  return { preparePayload };
};
