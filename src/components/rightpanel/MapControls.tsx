
import React from 'react';
import { Button } from '@/components/ui/button';
import { LayersIcon } from 'lucide-react';

interface MapControlsProps {
  showGeoJson: boolean;
  onToggleGeoJson: () => void;
  isMapInitialized: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({ 
  showGeoJson, 
  onToggleGeoJson,
  isMapInitialized 
}) => {
  if (!isMapInitialized) return null;
  
  return (
    <div className="absolute bottom-4 right-4 z-10">
      <Button 
        variant="outline" 
        size="sm" 
        className="bg-white" 
        onClick={onToggleGeoJson}
        title={showGeoJson ? "도로망 숨기기" : "도로망 표시하기"}
      >
        <LayersIcon className="w-4 h-4 mr-1" />
        {showGeoJson ? "도로망 숨기기" : "도로망 표시하기"}
      </Button>
    </div>
  );
};

export default MapControls;
