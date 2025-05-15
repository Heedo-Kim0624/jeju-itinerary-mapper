
import React, { useState, useEffect } from 'react';
import { Place } from '@/types/supabase';
import { NormalizedPlace } from '@/lib/jeju/interfaces';

// 컴포넌트 Props 타입 정의
interface CategoryResultsPanelProps {
  category: string;
  regions: string[];
  keywords: string[];
  onClose: () => void;
  isLoading: boolean;
  recommendedPlaces: Place[];
  normalPlaces: Place[];
  selectedPlaces: Place[];
  onSelectPlace: (place: Place, checked: boolean, category: string) => void;
  isPlaceSelected: (id: string) => boolean;
}

const CategoryResultsPanel: React.FC<CategoryResultsPanelProps> = ({
  category,
  regions,
  keywords,
  onClose,
  isLoading,
  recommendedPlaces,
  normalPlaces,
  selectedPlaces,
  onSelectPlace,
  isPlaceSelected
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredRecommended, setFilteredRecommended] = useState<Place[]>([]);
  const [filteredNormal, setFilteredNormal] = useState<Place[]>([]);

  // 주소 정보 안전하게 접근하는 함수
  const getAddress = (place: Place): string => {
    if (place.roadAddress) return place.roadAddress;
    if (place.lotAddress) return place.lotAddress || '';
    return '주소 정보 없음';
  };

  // 검색어에 따라 장소 필터링
  useEffect(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      setFilteredRecommended(recommendedPlaces);
      setFilteredNormal(normalPlaces);
      return;
    }

    const filterPlacesByTerm = (places: Place[]) => 
      places.filter(place => 
        place.name.toLowerCase().includes(term) || 
        (getAddress(place).toLowerCase().includes(term))
      );

    setFilteredRecommended(filterPlacesByTerm(recommendedPlaces));
    setFilteredNormal(filterPlacesByTerm(normalPlaces));
  }, [searchTerm, recommendedPlaces, normalPlaces]);

  // 장소 렌더링 함수
  const renderPlaceItem = (place: Place) => {
    const isSelected = isPlaceSelected(place.id);
    
    return (
      <div key={place.id} className="p-3 border-b border-gray-100 last:border-0 hover:bg-gray-50">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{place.name}</h3>
            <p className="text-sm text-gray-500">{getAddress(place)}</p>
          </div>
          <div className="flex gap-2">
            <button 
              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => {/* 지도에서 보기 기능 */}}
            >
              지도
            </button>
            <button 
              className={`px-2 py-1 text-xs rounded ${
                isSelected ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
              onClick={() => onSelectPlace(place, !isSelected, category)}
            >
              {isSelected ? '제거' : '추가'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed top-0 left-[300px] w-[300px] h-full bg-white border-l border-r border-gray-200 z-40 shadow-md">
      <div className="h-full flex flex-col">
        {/* 헤더 */}
        <div className="p-4 border-b border-gray-200 bg-white flex justify-between items-center">
          <h2 className="font-semibold text-lg">{category} 선택</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            &times;
          </button>
        </div>

        {/* 검색 필드 */}
        <div className="p-3 border-b border-gray-200">
          <input
            type="text"
            placeholder="장소 이름 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded"
          />
        </div>

        {/* 본문 */}
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <span className="animate-spin mr-2">⟳</span>
              <span>로딩 중...</span>
            </div>
          ) : (
            <>
              {/* 추천 장소 섹션 */}
              <div className="p-3 bg-gray-50">
                <h3 className="font-medium text-sm text-gray-600 mb-2">
                  🌟 추천 장소 ({regions.join(', ')})
                </h3>
              </div>
              <div>
                {filteredRecommended.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchTerm ? '검색 결과가 없습니다' : '추천 장소가 없습니다'}
                  </div>
                ) : (
                  filteredRecommended.map(renderPlaceItem)
                )}
              </div>

              {/* 일반 장소 섹션 */}
              {normalPlaces.length > 0 && (
                <>
                  <div className="p-3 bg-gray-50 border-t border-gray-200">
                    <h3 className="font-medium text-sm text-gray-600 mb-2">
                      📍 주변 장소
                    </h3>
                  </div>
                  <div>
                    {filteredNormal.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        {searchTerm ? '검색 결과가 없습니다' : '주변 장소가 없습니다'}
                      </div>
                    ) : (
                      filteredNormal.map(renderPlaceItem)
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            선택 완료
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryResultsPanel;
