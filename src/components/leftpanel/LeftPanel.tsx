import React from 'react';
import { useLeftPanel } from '@/hooks/use-left-panel';
import { LeftPanelContainer } from './LeftPanelContainer';
import { LeftPanelContent } from './LeftPanelContent';
import { ScheduleGenerator } from './ScheduleGenerator';
import { ItineraryPanel } from './ItineraryPanel';
import ItineraryView from './ItineraryView'; // Import ItineraryView for direct use if needed

export const LeftPanel: React.FC = () => {
  const {
    regionSelection,
    categorySelection,
    keywordsAndInputs,
    placesManagement,
    tripDetails,
    uiVisibility,
    itineraryManagement,
    currentPanel,
    isCategoryLoading,
    categoryResults,
    panelHandlers, // Assuming use-panel-handlers is merged into useLeftPanel or passed through
  } = useLeftPanel();

  const handleDatesSelected = (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => {
    tripDetails.setDates(dates);
    // Potentially move to next panel or trigger other logic
    // panelHandlers.navigateTo('category'); // Example
  };

  if (uiVisibility.showItinerary && itineraryManagement.itinerary.length > 0) {
    return (
      <LeftPanelContainer>
        <ItineraryView // Or ItineraryPanel which wraps ItineraryView
          itinerary={itineraryManagement.itinerary}
          startDate={tripDetails.startDate || new Date()}
          selectedDay={itineraryManagement.selectedItineraryDay}
          onSelectDay={itineraryManagement.handleSelectItineraryDay}
          // onClose might be part of panelHandlers.handleCloseItinerary now
        />
         <button 
            onClick={panelHandlers.handleCloseItinerary} 
            className="absolute top-4 right-4 text-sm text-blue-600 hover:underline z-20"
          >
            닫기
          </button>
      </LeftPanelContainer>
    );
  }

  return (
    <LeftPanelContainer>
      <LeftPanelContent
        currentPanel={currentPanel}
        regionSelection={regionSelection}
        tripDetails={tripDetails}
        onDatesSelected={handleDatesSelected}
        categorySelection={categorySelection}
        keywordsAndInputs={keywordsAndInputs}
        placesManagement={placesManagement}
        isCategoryLoading={isCategoryLoading}
        categoryResults={categoryResults}
        panelHandlers={panelHandlers}
        itineraryManagement={itineraryManagement} // Pass this down
        uiVisibility={uiVisibility} // Pass this down
      />
    </LeftPanelContainer>
  );
};
