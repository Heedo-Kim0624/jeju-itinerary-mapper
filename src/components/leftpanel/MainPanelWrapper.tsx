
import React from 'react';
import LeftPanelContainer from './LeftPanelContainer';
import LeftPanelContent from './LeftPanelContent';
import type { MainPanelWrapperPassedProps } from '@/types/left-panel/index';
import type { CategoryName } from '@/types/core';

const MainPanelWrapper: React.FC<MainPanelWrapperPassedProps> = ({
  leftPanelContainerProps,
  leftPanelContentProps,
}) => {
  // Convert Records to the expected object structure for LeftPanelContent props
  const categoryNameToEnglish = {
    '숙소': 'accomodation',
    '관광지': 'landmark',
    '음식점': 'restaurant',
    '카페': 'cafe'
  };
  
  // Create objects with expected properties for the component props
  const onConfirmCategoryMapping = {
    accomodation: (finalKeywords: string[]) => 
      leftPanelContentProps.onConfirmCategoryCallbacks['숙소'](finalKeywords),
    landmark: (finalKeywords: string[]) => 
      leftPanelContentProps.onConfirmCategoryCallbacks['관광지'](finalKeywords),
    restaurant: (finalKeywords: string[]) => 
      leftPanelContentProps.onConfirmCategoryCallbacks['음식점'](finalKeywords),
    cafe: (finalKeywords: string[]) => 
      leftPanelContentProps.onConfirmCategoryCallbacks['카페'](finalKeywords),
  };

  const handlePanelBackMapping = {
    accomodation: () => leftPanelContentProps.handlePanelBackCallbacks['숙소'](),
    landmark: () => leftPanelContentProps.handlePanelBackCallbacks['관광지'](),
    restaurant: () => leftPanelContentProps.handlePanelBackCallbacks['음식점'](),
    cafe: () => leftPanelContentProps.handlePanelBackCallbacks['카페'](),
  };

  // Convert the directInputValues from Record<CategoryName, string> to the expected structure
  const directInputValues = {
    accomodation: leftPanelContentProps.directInputValues['숙소'] || '',
    landmark: leftPanelContentProps.directInputValues['관광지'] || '',
    restaurant: leftPanelContentProps.directInputValues['음식점'] || '',
    cafe: leftPanelContentProps.directInputValues['카페'] || '',
  };

  // Create onDirectInputChange handlers for each category
  const onDirectInputChangeHandlers = {
    accomodation: (value: string) => leftPanelContentProps.onDirectInputChange('숙소', value),
    landmark: (value: string) => leftPanelContentProps.onDirectInputChange('관광지', value),
    restaurant: (value: string) => leftPanelContentProps.onDirectInputChange('음식점', value),
    cafe: (value: string) => leftPanelContentProps.onDirectInputChange('카페', value),
  };
  
  return (
    <LeftPanelContainer
      {...leftPanelContainerProps}
      children={
        <LeftPanelContent
          {...leftPanelContentProps}
          directInputValues={directInputValues}
          onDirectInputChange={onDirectInputChangeHandlers}
          onConfirmCategory={onConfirmCategoryMapping}
          handlePanelBack={handlePanelBackMapping}
        />
      }
    />
  );
};

export default MainPanelWrapper;
