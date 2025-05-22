
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
// Import the specific prop types from the consolidated types file
import type { MainPanelWrapperPassedProps } from '@/types/left-panel/index';

// Props are now directly from the imported interface
// MainPanelWrapperProps is effectively MainPanelWrapperPassedProps
const MainPanelWrapper: React.FC<MainPanelWrapperPassedProps> = ({
  leftPanelContainerProps,
  leftPanelContentProps, // This is now correctly typed with Record<CategoryName, string> for directInputValues
}) => {
  return (
    <LeftPanelContainer
      {...leftPanelContainerProps}
      children={
        <LeftPanelContent
          {...leftPanelContentProps}
          // These props might need adjustment if LeftPanelContent's own props changed.
          // Assuming onConfirmCategory and handlePanelBack in LeftPanelContent match the structure of onConfirmCategoryCallbacks etc.
          onConfirmCategory={leftPanelContentProps.onConfirmCategoryCallbacks}
          handlePanelBack={leftPanelContentProps.handlePanelBackCallbacks}
        />
      }
    />
  );
};

export default MainPanelWrapper;
