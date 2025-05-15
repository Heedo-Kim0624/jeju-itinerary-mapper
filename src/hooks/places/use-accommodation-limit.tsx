
import { useTripDetails } from '@/hooks/use-trip-details';
import { toast } from 'sonner';

/**
 * Hook to check accommodation limits based on trip duration
 */
export const useAccommodationLimit = () => {
  const { tripDuration } = useTripDetails();

  /**
   * Checks if the accommodation limit has been reached
   * @param currentCount Current number of accommodation selections
   * @returns Boolean indicating if limit is reached
   */
  const isAccommodationLimitReached = (currentCount: number): boolean => {
    if (!tripDuration || tripDuration < 1) return false;
    
    // For n nights, allow maximum n accommodations
    return currentCount >= tripDuration;
  };

  /**
   * Validates if an accommodation can be added based on current count
   * @param currentCount Current number of accommodation selections
   * @returns Boolean indicating if accommodation can be added
   */
  const validateAccommodationAdd = (currentCount: number): boolean => {
    if (isAccommodationLimitReached(currentCount)) {
      toast.error(`${tripDuration}박 여행에는 최대 ${tripDuration}개의 숙소만 선택할 수 있습니다.`);
      return false;
    }
    return true;
  };

  return {
    isAccommodationLimitReached,
    validateAccommodationAdd,
    tripDuration
  };
};
