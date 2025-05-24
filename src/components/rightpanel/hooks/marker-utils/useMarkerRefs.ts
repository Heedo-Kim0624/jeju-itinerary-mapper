
import { useRef } from 'react';
import type { Place, ItineraryDay } from '@/types/core';

export const useMarkerRefs = () => {
  const markersRef = useRef<naver.maps.Marker[]>([]);
  const prevSelectedDayRef = useRef<number | null>(null);
  const prevItineraryRef = useRef<ItineraryDay[] | null>(null);
  const prevPlacesRef = useRef<Place[] | null>(null);
  const updateRequestIdRef = useRef<number>(0);

  return {
    markersRef,
    prevSelectedDayRef,
    prevItineraryRef,
    prevPlacesRef,
    updateRequestIdRef,
  };
};
