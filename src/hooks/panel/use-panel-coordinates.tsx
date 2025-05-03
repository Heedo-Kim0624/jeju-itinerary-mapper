
import { useEffect, useState } from 'react';
import { useMapContext } from '@/components/rightpanel/MapContext';

export const usePanelCoordinates = (selectedRegions: string[]) => {
  const { panTo } = useMapContext();

  // Function to pan to a region when selected
  const panToSelectedRegion = () => {
    if (selectedRegions.length > 0) {
      panTo(selectedRegions[0]);
    }
  };

  return {
    panToSelectedRegion
  };
};
