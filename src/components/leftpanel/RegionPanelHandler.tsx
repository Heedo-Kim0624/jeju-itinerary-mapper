import React, { useState, useEffect } from 'react';
import { RegionDetails } from '@/types/region';
import RegionPanel from './RegionPanel'; // 수정된 경로
import { REGIONS_DATA } from '@/utils/regionData';

interface RegionPanelHandlerProps {
  onClose: () => void;
  onRegionsSelected: (regions: RegionDetails[]) => void;
  selectedRegions: RegionDetails[];
}

const RegionPanelHandler: React.FC<RegionPanelHandlerProps> = ({
  onClose,
  onRegionsSelected,
  selectedRegions
}) => {
// ... keep existing code (RegionPanelHandler logic)
  const [regions, setRegions] = useState<RegionDetails[]>(REGIONS_DATA);
  const [selected, setSelected] = useState<RegionDetails[]>(selectedRegions || []);

  // 지역 선택 핸들러
  const handleRegionSelect = (region: RegionDetails) => {
    setSelected(prev => {
      const isAlreadySelected = prev.some(r => r.id === region.id);
      if (isAlreadySelected) {
        return prev.filter(r => r.id !== region.id);
      } else {
        return [...prev, region];
      }
    });
  };

  // 선택 완료 핸들러
  const handleSubmit = () => {
    onRegionsSelected(selected);
    onClose();
  };

  return (
    <RegionPanel
      regions={regions}
      selectedRegions={selected}
      onRegionSelect={handleRegionSelect}
      onSubmit={handleSubmit}
      onCancel={onClose}
    />
  );
};

export default RegionPanelHandler;
