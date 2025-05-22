
import { useMemo } from 'react';
import type { useItineraryDisplayProps } from './props/useItineraryDisplayProps';
import type { useMainPanelContainerProps } from './props/useMainPanelContainerProps';
import type { useLeftPanelContentProps } from './props/useLeftPanelContentProps';
import type { useLeftPanelCallbacks } from './use-left-panel-callbacks';

// Helper types for clarity, derived from the return types of existing hooks
type ItineraryDisplayPropsInput = ReturnType<typeof useItineraryDisplayProps>;

// Type for the structure of mainPanelProps when it's not null
type DefinedMainPanelProps = {
  leftPanelContainerProps: ReturnType<typeof useMainPanelContainerProps>;
  leftPanelContentProps: ReturnType<typeof useLeftPanelContentProps>;
};

type CallbacksInput = ReturnType<typeof useLeftPanelCallbacks>;
type HandleTriggerCreateItineraryInput = () => Promise<any | null>;

interface UseEnhancedPanelPropsArgs {
  itineraryDisplayProps: ItineraryDisplayPropsInput;
  mainPanelProps: DefinedMainPanelProps | null; // Corrected: mainPanelProps can be an object убий or null
  callbacks: CallbacksInput;
  handleTriggerCreateItinerary: HandleTriggerCreateItineraryInput;
}

export const useEnhancedPanelProps = ({
  itineraryDisplayProps,
  mainPanelProps,
  callbacks,
  handleTriggerCreateItinerary,
}: UseEnhancedPanelPropsArgs) => {
  const enhancedItineraryDisplayProps = useMemo(() => {
    return itineraryDisplayProps
      ? {
          ...itineraryDisplayProps,
          handleClosePanelWithBackButton: callbacks.handleClosePanelWithBackButton,
        }
      : null;
  }, [itineraryDisplayProps, callbacks.handleClosePanelWithBackButton]);

  const enhancedMainPanelProps = useMemo(() => {
    // mainPanelProps can be null, so we check for its existence first.
    // If it exists, leftPanelContainerProps must also exist based on its definition.
    if (!mainPanelProps || !mainPanelProps.leftPanelContainerProps) {
      return null;
    }
    return {
      leftPanelContainerProps: {
        ...mainPanelProps.leftPanelContainerProps,
        onCreateItinerary: handleTriggerCreateItinerary,
      },
      leftPanelContentProps: mainPanelProps.leftPanelContentProps,
    };
  }, [mainPanelProps, handleTriggerCreateItinerary]);

  return {
    enhancedItineraryDisplayProps,
    enhancedMainPanelProps,
  };
};
