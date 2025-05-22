
import { useMemo } from 'react';
import type { useItineraryDisplayProps } from './props/useItineraryDisplayProps';
import type { useMainPanelContainerProps } from './props/useMainPanelContainerProps';
import type { useLeftPanelContentProps } from './props/useLeftPanelContentProps';
import type { useLeftPanelCallbacks } from './use-left-panel-callbacks';

// Helper types for clarity, derived from the return types of existing hooks
type ItineraryDisplayPropsInput = ReturnType<typeof useItineraryDisplayProps>;
interface MainPanelPropsInput {
  leftPanelContainerProps: ReturnType<typeof useMainPanelContainerProps>;
  leftPanelContentProps: ReturnType<typeof useLeftPanelContentProps>;
} | null;
type CallbacksInput = ReturnType<typeof useLeftPanelCallbacks>;
type HandleTriggerCreateItineraryInput = () => Promise<any | null>;

interface UseEnhancedPanelPropsArgs {
  itineraryDisplayProps: ItineraryDisplayPropsInput;
  mainPanelProps: MainPanelPropsInput;
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
