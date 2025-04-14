
import React from 'react';
import RegionSelector from '../middlepanel/RegionSelector';

interface RegionModalProps {
  isOpen: boolean;
  selectedRegions: string[];
  onToggleRegion: (region: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}

const RegionModal: React.FC<RegionModalProps> = ({
  isOpen,
  selectedRegions,
  onToggleRegion,
  onClose,
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-[300px]">
        <RegionSelector
          selectedRegions={selectedRegions}
          onToggle={onToggleRegion}
          onClose={onClose}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
};

export default RegionModal;
