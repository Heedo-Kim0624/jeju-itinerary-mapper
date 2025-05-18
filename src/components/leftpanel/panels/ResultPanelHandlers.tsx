
import React from 'react';
import RegionPanelHandler from '../RegionPanelHandler';
import CategoryResultHandler from '../CategoryResultHandler';
import { CategoryName } from '@/utils/categoryUtils';
import { Place } from '@/types/supabase';

interface ResultPanelHandlersProps {
  regionSlidePanelOpen: boolean;
  setRegionSlidePanelOpen: (open: boolean) => void;
  selectedRegions: string[];
  handleRegionToggle: (region: string) => void;
  setRegionConfirmed: (confirmed: boolean) => void;
  showCategoryResult: CategoryName | null;
  selectedKeywordsByCategory: Record<string, string[]>;
  handleResultClose: () => void;
  handleSelectPlace: (place: Place) => void;
  selectedPlaces: Place[];
  handleConfirmCategory: (category: CategoryName, userSelectedInPanel: Place[], recommendedPoolForCategory: Place[]) => void;
}

const ResultPanelHandlers: React.FC<ResultPanelHandlersProps> = ({
  regionSlidePanelOpen,
  setRegionSlidePanelOpen,
  selectedRegions,
  handleRegionToggle,
  setRegionConfirmed,
  showCategoryResult,
  selectedKeywordsByCategory,
  handleResultClose,
  handleSelectPlace,
  selectedPlaces,
  handleConfirmCategory
}) => {
  return (
    <>
      <RegionPanelHandler
        open={regionSlidePanelOpen}
        onClose={() => setRegionSlidePanelOpen(false)}
        selectedRegions={selectedRegions}
        onToggle={handleRegionToggle}
        onConfirm={() => {
          setRegionSlidePanelOpen(false);
          if (selectedRegions.length > 0) {
            setRegionConfirmed(true);
          }
        }}
      />

      <CategoryResultHandler
        showCategoryResult={showCategoryResult}
        selectedRegions={selectedRegions}
        selectedKeywordsByCategory={selectedKeywordsByCategory}
        onClose={handleResultClose}
        onSelectPlace={handleSelectPlace}
        selectedPlaces={selectedPlaces}
        onConfirmCategory={handleConfirmCategory}
      />
    </>
  );
};

export default ResultPanelHandlers;
