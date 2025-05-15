
import { useState } from 'react';

export const usePanelVisibility = () => {
  const [showItinerary, setShowItinerary] = useState(false);
  const [regionSlidePanelOpen, setRegionSlidePanelOpen] = useState(false);
  const [showCategoryResult, setShowCategoryResult] = useState<"숙소" | "음식점" | "명소" | "카페">("명소");

  // Adding the missing setItineraryPanelDisplayed function
  const setItineraryPanelDisplayed = (value: boolean) => {
    setShowItinerary(value);
  };

  return {
    showItinerary,
    setShowItinerary,
    regionSlidePanelOpen,
    setRegionSlidePanelOpen,
    showCategoryResult,
    setShowCategoryResult,
    setItineraryPanelDisplayed // Adding the new function
  };
};
