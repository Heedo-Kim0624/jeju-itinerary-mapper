
import React from 'react';

interface ItineraryButtonProps {
  onGenerateItinerary: () => void;
  categorySelectionConfirmed: boolean;
  categoryOrder: string[];
  currentCategoryIndex: number;
}

const ItineraryButton: React.FC<ItineraryButtonProps> = ({
  onGenerateItinerary,
  categorySelectionConfirmed,
  categoryOrder,
  currentCategoryIndex
}) => {
  if (
    !categorySelectionConfirmed || 
    categoryOrder.length !== 4 || 
    currentCategoryIndex < categoryOrder.length
  ) {
    return null;
  }

  return (
    <div className="mt-4">
      <button
        className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 text-sm"
        onClick={onGenerateItinerary}
      >
        일정생성
      </button>
    </div>
  );
};

export default ItineraryButton;
