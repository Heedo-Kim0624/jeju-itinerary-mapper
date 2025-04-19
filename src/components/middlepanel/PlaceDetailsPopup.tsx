// middlepanel/PlaceDetailsPopup.tsx (이 행 삭제 금지)
import React from 'react';
import { MapPin, Star, Clock, ExternalLink, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Place } from '@/types/supabase';

interface PlaceDetailsPopupProps {
  place: Place;
  onClose: () => void;
}

const PlaceDetailsPopup: React.FC<PlaceDetailsPopupProps> = ({ place, onClose }) => {
  return (
    // ★ 전체 화면을 덮는 반투명 오버레이
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50">
      <Card className="w-[90%] max-w-[360px] shadow-xl border border-gray-300 bg-white">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-base font-semibold leading-tight">{place.name}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>

          {place.address && (
            <div className="flex items-start gap-2 mb-1">
              <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-700">{place.address}</span>
            </div>
          )}

          {place.operatingHours && (
            <div className="flex items-start gap-2 mb-1">
              <Clock className="h-4 w-4 text-gray-500 mt-0.5" />
              <span className="text-sm text-gray-700">{place.operatingHours}</span>
            </div>
          )}

          {place.rating != null && (
            <div className="flex items-center gap-2 mt-1">
              <Star className="h-4 w-4 text-amber-400" />
              <span className="text-sm font-medium">{place.rating.toFixed(1)}</span>
              {place.reviewCount != null && (
                <span className="text-xs text-gray-500">({place.reviewCount} 리뷰)</span>
              )}
            </div>
          )}

          <div className="flex gap-2 mt-4">
            {place.naverLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(place.naverLink, '_blank')}
                className="flex gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                네이버 지도
              </Button>
            )}

            {place.instaLink && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(place.instaLink, '_blank')}
                className="flex gap-1"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                인스타그램
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceDetailsPopup;
