import React from 'react';
import RegionSelector from '../leftpanel/RegionSelector';

interface RegionSlidePanelProps {
  open: boolean;
  onClose: () => void;
  selectedRegions: string[];
  onToggle: (region: string) => void;
  onConfirm: () => void;
}

const RegionSlidePanel: React.FC<RegionSlidePanelProps> = ({
  open,
  onClose,
  selectedRegions,
  onToggle,
  onConfirm,
}) => {
  return (
    <div
      className={`absolute left-[300px] top-0 h-full bg-white border-l shadow-lg transition-transform duration-300 ease-in-out z-40 ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
      style={{ width: '280px' }}
    >
      <RegionSelector
        selectedRegions={selectedRegions}
        onToggle={onToggle}
        onClose={onClose}
        onConfirm={onConfirm}
      />
    </div>
  );
};

export default RegionSlidePanel;