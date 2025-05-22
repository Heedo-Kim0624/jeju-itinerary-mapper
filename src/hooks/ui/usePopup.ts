
import { useState } from 'react';
import type { ItineraryPlaceWithTime } from '@/types/core';

export const usePopup = () => {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<ItineraryPlaceWithTime | null>(null);

  const openPopup = (place: ItineraryPlaceWithTime) => {
    setSelectedPlace(place);
    setIsPopupOpen(true);
  };

  const closePopup = () => {
    setIsPopupOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsPopupOpen(open);
    if (!open) {
      // 닫을 때 약간의 지연 후 선택된 장소 초기화 (애니메이션 완료 후)
      setTimeout(() => {
        setSelectedPlace(null);
      }, 300);
    }
  };

  return {
    isPopupOpen,
    selectedPlace,
    openPopup,
    closePopup,
    handleOpenChange
  };
};
