
import React from 'react';
import { Place } from '@/types/supabase';
import { X } from 'lucide-react';

interface CategoryResultsPanelProps {
  category: string;
  isLoading: boolean;
  recommendedPlaces: Place[];
  normalPlaces: Place[];
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean, category: string | null) => void;
  onClose: () => void;
  selectedCount: number;
}

const CategoryResultsPanel: React.FC<CategoryResultsPanelProps> = ({
  category,
  isLoading,
  recommendedPlaces,
  normalPlaces,
  selectedPlaces,
  onSelectPlace,
  onClose,
  selectedCount
}) => {
  const isSelected = (place: Place) => {
    return selectedPlaces.some(selected => selected.id === place.id);
  };

  return (
    <div className="bg-white w-full max-w-xl rounded-lg shadow-xl flex flex-col h-[80vh]">
      {/* Header */}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-lg font-medium">{category} 검색 결과</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
          <X size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-auto">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Recommended Places */}
            {recommendedPlaces.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-3">추천 {category}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {recommendedPlaces.map(place => (
                    <div key={place.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{place.name}</p>
                        <p className="text-sm text-gray-500">{place.address?.roadAddress || place.address?.lotAddress || '주소 정보 없음'}</p>
                      </div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600"
                          checked={isSelected(place)}
                          onChange={(e) => onSelectPlace(place, e.target.checked, category)}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Normal Places */}
            {normalPlaces.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-3">기타 {category}</h3>
                <div className="grid grid-cols-1 gap-3">
                  {normalPlaces.map(place => (
                    <div key={place.id} className="border rounded-md p-3 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{place.name}</p>
                        <p className="text-sm text-gray-500">{place.address?.roadAddress || place.address?.lotAddress || '주소 정보 없음'}</p>
                      </div>
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          className="form-checkbox h-5 w-5 text-blue-600"
                          checked={isSelected(place)}
                          onChange={(e) => onSelectPlace(place, e.target.checked, category)}
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {recommendedPlaces.length === 0 && normalPlaces.length === 0 && (
              <div className="flex flex-col items-center justify-center h-64">
                <p className="text-gray-500">검색 결과가 없습니다.</p>
                <p className="text-sm text-gray-400">다른 키워드나 지역을 선택해보세요.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t flex justify-between items-center">
        <p className="text-sm">{selectedCount}개의 {category} 선택됨</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          확인
        </button>
      </div>
    </div>
  );
};

export default CategoryResultsPanel;
