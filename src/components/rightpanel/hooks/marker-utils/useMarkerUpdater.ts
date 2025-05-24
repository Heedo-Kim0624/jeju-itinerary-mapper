
import { useState, useCallback } from 'react';

interface UseMarkerUpdaterProps {
  updateRequestIdRef: React.MutableRefObject<number>;
}

export const useMarkerUpdater = ({ updateRequestIdRef }: UseMarkerUpdaterProps) => {
  const [updateTriggerId, setUpdateTriggerId] = useState<number>(0);

  const forceMarkerUpdate = useCallback(() => {
    const newUpdateId = updateRequestIdRef.current + 1;
    updateRequestIdRef.current = newUpdateId;
    
    console.log(`[useMarkerUpdater] forceMarkerUpdate called, updateId: ${newUpdateId}`);
    
    // Ensure updates are batched and occur after other state changes
    setTimeout(() => {
      if (updateRequestIdRef.current === newUpdateId) {
        setUpdateTriggerId(currentId => currentId + 1); // Increment to ensure change
      }
    }, 50);
  }, [updateRequestIdRef, setUpdateTriggerId]);

  return {
    updateTriggerId,
    forceMarkerUpdate,
  };
};
