
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
// Removed local Place, ItineraryDay, CategoryName imports as they are handled in types.ts
import type { MainPanelWrapperProps, LeftPanelContentPassedProps } from './types'; // Import centralized types

const MainPanelWrapper: React.FC<MainPanelWrapperProps> = ({
  leftPanelContainerProps,
  leftPanelContentProps,
}) => {
  // Fixed the call signatures by creating properly typed handler objects
  const onDirectInputChangeHandlers = {
    accomodation: leftPanelContentProps.onDirectInputChange.accomodation,
    landmark: leftPanelContentProps.onDirectInputChange.landmark,
    restaurant: leftPanelContentProps.onDirectInputChange.restaurant,
    cafe: leftPanelContentProps.onDirectInputChange.cafe
  };

  return (
    <LeftPanelContainer
      {...leftPanelContainerProps}
      children={
        <LeftPanelContent
          {...leftPanelContentProps}
          onDirectInputChange={onDirectInputChangeHandlers}
          onConfirmCategory={leftPanelContentProps.onConfirmCategoryCallbacks}
          handlePanelBack={leftPanelContentProps.handlePanelBackCallbacks}
        />
      }
    />
  );
};

export default MainPanelWrapper;
