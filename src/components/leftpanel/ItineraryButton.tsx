
import React from 'react';
import { toast } from 'sonner';

interface ItineraryButtonProps {
  allCategoriesSelected: boolean;
  onCreateItinerary: () => void;
}

const ItineraryButton: React.FC<ItineraryButtonProps> = ({
  allCategoriesSelected,
  onCreateItinerary
}) => {
  return (
    <div className="mt-4">
      {allCategoriesSelected && (
        <button
          onClick={onCreateItinerary}
          className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors flex items-center justify-center"
        >
          <span className="mr-1">경로 생성</span>
        </button>
      )}
    </div>
  );
};

export default ItineraryButton;
