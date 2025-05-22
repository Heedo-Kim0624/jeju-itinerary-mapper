import { useState } from 'react';
import { Place, CategoryName } from '@/types/core';

/**
 * Manages the local state for the left panel
 */
export const useLeftPanelState = () => {
  // UI state for the left panel
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentPanel, setCurrentPanel] = useState<'region' | 'date' | 'category' | 'itinerary'>('region');
  const [showCategoryResult, setShowCategoryResult] = useState<CategoryName | null>(null);
  
  // Loading/progress states
  const [isGenerating, setIsGenerating] = useState(false);
  const [itineraryReceived, setItineraryReceived] = useState(false);

  return {
    // Panel UI state
    selectedCategory,
    setSelectedCategory,
    currentPanel,
    setCurrentPanel,
    
    // Category results state
    showCategoryResult,
    setShowCategoryResult,
    
    // Loading/progress states
    isGenerating,
    setIsGenerating,
    itineraryReceived,
    setItineraryReceived
  };
};
