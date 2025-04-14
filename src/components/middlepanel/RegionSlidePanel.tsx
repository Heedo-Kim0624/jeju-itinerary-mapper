// RegionSlidePanel.tsx
import React from 'react';
import RegionSelector from '../middlepanel/RegionSelector';

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
  if (!open) return null; // 초기 렌더 방지

  return (
    <div
      className="absolute top-0 left-full w-[280px] h-full bg-white border-l shadow-md z-10 transition-transform duration-300 ease-in-out"
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
