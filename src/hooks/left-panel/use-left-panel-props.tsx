
import { useMemo } from 'react';
import type { LeftPanelPropsData } from '@/types/left-panel';
import { useItineraryDisplayProps } from './props/useItineraryDisplayProps';
import { useMainPanelContainerProps } from './props/useMainPanelContainerProps';
import { useLeftPanelContentProps } from './props/useLeftPanelContentProps';
import { useDevDebugInfoProps } from './props/useDevDebugInfoProps';

export const useLeftPanelProps = (leftPanelData: LeftPanelPropsData) => {
  const {
    uiVisibility,
    itineraryManagement,
    tripDetails,
    handleCloseItinerary,
    placesManagement,
    isGeneratingItinerary,
    categorySelection,
    regionSelection,
    keywordsAndInputs,
    onConfirmCategoryCallbacks,
    handlePanelBackCallbacks,
    itineraryReceived, // Ensure this is destructured
  } = leftPanelData;

  const itineraryDisplayProps = useItineraryDisplayProps({
    uiVisibility,
    itineraryManagement,
    tripDetails,
    handleCloseItinerary,
  });

  const leftPanelContainerProps = useMainPanelContainerProps({
    uiVisibility,
    placesManagement,
    tripDetails,
    itineraryManagement,
    isGeneratingItinerary,
  });

  const leftPanelContentProps = useLeftPanelContentProps({
    tripDetails,
    regionSelection, // Pass the whole object, sub-hook will handle if it's undefined
    categorySelection,
    keywordsAndInputs,
    isGeneratingItinerary,
    uiVisibility,
    onConfirmCategoryCallbacks,
    handlePanelBackCallbacks,
  });
  
  const mainPanelProps = useMemo(() => {
    if (leftPanelContainerProps && leftPanelContentProps) {
      return { leftPanelContainerProps, leftPanelContentProps };
    }
    return null;
  }, [leftPanelContainerProps, leftPanelContentProps]);

  const devDebugInfoProps = useDevDebugInfoProps({
    uiVisibility,
    itineraryManagement,
    isGeneratingItinerary,
    itineraryReceived, // Pass directly
    tripDetails,
  });

  return {
    itineraryDisplayProps,
    mainPanelProps,
    devDebugInfoProps,
  };
};
