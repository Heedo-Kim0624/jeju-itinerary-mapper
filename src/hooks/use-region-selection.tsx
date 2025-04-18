
import { useState } from 'react';

export const useRegionSelection = () => {
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);

  const handleRegionToggle = (region: string) => {
    setSelectedRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  return {
    selectedRegions,
    setSelectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle
  };
};
