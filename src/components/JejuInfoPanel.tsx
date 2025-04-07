
import React from 'react';
import { JEJU_LANDMARKS } from '@/utils/jejuMapStyles';
import { Button } from "@/components/ui/button";

interface JejuInfoPanelProps {
  onSelectLocation: (lat: number, lng: number, name: string) => void;
}

const JejuInfoPanel: React.FC<JejuInfoPanelProps> = ({ onSelectLocation }) => {
  return (
    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-md shadow-md z-10 max-w-xs overflow-auto max-h-[calc(100%-2rem)]">
      <h3 className="font-bold text-lg mb-2">제주도 둘러보기</h3>
      <p className="text-sm text-gray-600 mb-4">제주도의 주요 명소를 탐색해보세요.</p>
      
      <div className="space-y-2">
        {JEJU_LANDMARKS.map((landmark) => (
          <div key={landmark.name} className="border-b border-gray-200 pb-2 last:border-0">
            <h4 className="font-medium text-base">{landmark.name}</h4>
            <p className="text-xs text-gray-500 mb-1.5">{landmark.description}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full text-xs py-1"
              onClick={() => onSelectLocation(landmark.lat, landmark.lng, landmark.name)}
            >
              이동하기
            </Button>
          </div>
        ))}
      </div>
      
      <div className="mt-4 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          제주도는 대한민국에서 가장 큰 섬으로, 아름다운 자연경관과 독특한 문화가 어우러진 세계적인 관광지입니다.
        </p>
      </div>
    </div>
  );
};

export default JejuInfoPanel;
