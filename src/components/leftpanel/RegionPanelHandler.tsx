
import React from 'react';
import RegionSlidePanel from '../middlepanel/RegionSlidePanel';
import { RegionDetails } from '@/utils/regionData';

interface RegionPanelHandlerProps {
  open: boolean;
  onClose: () => void;
  selectedRegions: RegionDetails[];
  onToggle: (region: RegionDetails) => void;
  onConfirm: () => void;
}

const RegionPanelHandler: React.FC<RegionPanelHandlerProps> = ({
  open,
  onClose,
  selectedRegions,
  onToggle,
  onConfirm
}) => {
  return (
    <RegionSlidePanel
      open={open}
      onClose={onClose}
      selectedRegions={selectedRegions}
      onToggle={onToggle}
      onConfirm={onConfirm}
    />
  );
};

export default RegionPanelHandler;
