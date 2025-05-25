
import { useCallback } from 'react';
import { parseServerResponse as actualParseFn } from './useServerResponseHandler';
import type { ItineraryDay, NewServerScheduleResponse } from '@/types/core';

export const useScheduleParser = () => {
  const parseScheduleResponse = useCallback(
    (
      serverResponse: NewServerScheduleResponse,
      startDate: Date
    ): ItineraryDay[] => {
      return actualParseFn(serverResponse, startDate);
    },
    []
  );

  return { parseScheduleResponse };
};
