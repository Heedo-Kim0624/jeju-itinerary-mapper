
import React from 'react';
import { RegionDetails } from '@/types/region';

interface RegionPanelProps {
  regions: RegionDetails[];
  selectedRegions: RegionDetails[];
  onRegionSelect: (region: RegionDetails) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

const RegionPanel: React.FC<RegionPanelProps> = ({
  regions,
  selectedRegions,
  onRegionSelect,
  onSubmit,
  onCancel,
}) => {
  // 기본 플레이스홀더 내용
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-4">지역 선택</h2>
      {regions.map(region => (
        <div key={region.id} className="mb-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={selectedRegions.some(sr => sr.id === region.id)}
              onChange={() => onRegionSelect(region)}
              className="mr-2"
            />
            {region.displayName || region.name}
          </label>
        </div>
      ))}
      <button onClick={onSubmit} className="p-2 bg-blue-500 text-white rounded mt-4">
        선택 완료
      </button>
      <button onClick={onCancel} className="p-2 bg-gray-300 rounded mt-2 ml-2">
        취소
      </button>
    </div>
  );
};

export default RegionPanel;
