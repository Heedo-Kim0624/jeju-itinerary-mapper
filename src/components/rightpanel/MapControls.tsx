
import React from 'react';
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, Loader2 } from 'lucide-react';

interface MapControlsProps {
  showGeoJson: boolean;
  onToggleGeoJson: () => void;
  isMapInitialized?: boolean;
  isGeoJsonLoaded?: boolean;
}

const MapControls: React.FC<MapControlsProps> = ({
  showGeoJson,
  onToggleGeoJson,
  isMapInitialized = false,
  isGeoJsonLoaded = false
}) => {
  // 컨트롤 버튼 표시 여부
  const showControls = isMapInitialized;
  
  if (!showControls) return null;

  return (
    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
      <Button
        variant="outline"
        size="icon"
        className="bg-white hover:bg-gray-100"
        onClick={onToggleGeoJson}
        title={showGeoJson ? "경로 숨기기" : "경로 표시하기"}
        disabled={!isMapInitialized}
      >
        {!isGeoJsonLoaded && showGeoJson ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : showGeoJson ? (
          <EyeOff className="h-4 w-4" />
        ) : (
          <Eye className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default MapControls;
