
import { useState } from 'react';
import { RegionDetails } from '@/utils/regionData';

export const useRegionSelection = () => {
  const [selectedRegions, setSelectedRegions] = useState<RegionDetails[]>([]);
  const [regionConfirmed, setRegionConfirmed] = useState(false);
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);

  const handleRegionToggle = (region: RegionDetails) => {
    setSelectedRegions((prev) =>
      prev.some(r => r.id === region.id)
        ? prev.filter((r) => r.id !== region.id)
        : [...prev, region]
    );
  };

  const isRegionSelected = selectedRegions.length > 0;

  const handleRegionChange = (regions: RegionDetails[]) => {
    setSelectedRegions(regions);
  };

  const confirmRegionSelection = () => {
    if (selectedRegions.length > 0) {
      setRegionConfirmed(true);
    }
  };

  const resetRegions = () => {
    setSelectedRegions([]);
    setRegionConfirmed(false);
  };

  const getRegionDisplayName = () => {
    if (selectedRegions.length === 0) return '지역 선택';
    if (selectedRegions.length === 1) return selectedRegions[0].name;
    return `${selectedRegions[0].name} 외 ${selectedRegions.length - 1}개 지역`;
  };

  return {
    selectedRegions,
    setSelectedRegions,
    regionConfirmed,
    setRegionConfirmed,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    handleRegionToggle,
    isRegionSelected,
    handleRegionChange,
    confirmRegionSelection,
    resetRegions,
    getRegionDisplayName
  };
};
