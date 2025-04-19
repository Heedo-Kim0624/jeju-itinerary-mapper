
import React from 'react';
import { Place } from '@/types/supabase';

interface PlaceListProps {
  places: Place[];
  loading: boolean;
  selectedPlace: Place | null;
  onSelectPlace: (place: Place) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const PlaceList: React.FC<PlaceListProps> = ({
  places,
  loading,
  selectedPlace,
  onSelectPlace,
  page,
  totalPages,
  onPageChange
}) => {
  if (loading) {
    return <div className="flex justify-center py-4">로딩 중...</div>;
  }

  if (!places.length) {
    return <div className="text-center py-4">검색 결과가 없습니다.</div>;
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-2">
        {places.map(place => (
          <div
            key={place.id}
            onClick={() => onSelectPlace(place)}
            className={`p-3 rounded-md cursor-pointer border ${
              selectedPlace?.id === place.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50 border-gray-200'
            }`}
          >
            <h3 className="font-medium">{place.name}</h3>
            <p className="text-sm text-gray-600">{place.address}</p>
            {place.rating && (
              <div className="flex items-center mt-1">
                <span className="text-yellow-500">★</span>
                <span className="text-sm ml-1">{place.rating} ({place.reviewCount || 0})</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className={`px-3 py-1 rounded ${
              page <= 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            이전
          </button>
          <span className="px-3 py-1">
            {page} / {totalPages}
          </span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className={`px-3 py-1 rounded ${
              page >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
};

export default PlaceList;
