
import React from 'react';
// Ensure ItineraryDay matches the one used in use-itinerary.tsx (CreatorItineraryDay)
import type { ItineraryDay } from '@/hooks/use-itinerary'; 

interface DebugPanelProps {
  isVisible: boolean;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible }) => {
  if (!isVisible) return null;
  
  const createMockItinerary = () => {
    const startDate = new Date();
    // This mockItinerary needs to conform to the ItineraryDay type from use-itinerary
    const mockItineraryData: ItineraryDay[] = [
      {
        day: 1,
        dayOfWeek: '목', // Example, derive properly if needed
        date: '05/22', // Example, derive properly
        places: [
          { id: "4060188202", name: '제주국제공항', category: 'attraction', geoNodeId: "4060188202", x: 126.49, y: 33.51, timeBlock: '09:00' } as any,
          { id: "4060020100", name: '항해진미', category: 'restaurant', geoNodeId: "4060020100", x: 126.52, y: 33.49, timeBlock: '12:00' } as any
        ],
        totalDistance: 10.5,
        interleaved_route: [4060188202, 4060539403, 4060020100], // Numbers
        routeData: {
          nodeIds: [4060188202, 4060020100], // Numbers
          linkIds: [4060539403] // Numbers
        }
      }
    ];
    
    console.log("[DebugPanel] 목업 일정 생성:", mockItineraryData);
    
    const event = new CustomEvent('itineraryCreated', {
      detail: {
        itinerary: mockItineraryData,
        selectedDay: 1
      }
    });
    window.dispatchEvent(event);
  };
  
  const dumpCurrentState = () => {
    // These would need to be exposed globally by the respective hooks for this to work,
    // or passed down as props. This is a simplified example.
    // @ts-ignore
    const itinerary = window.__ITINERARY_STATE__ || [];
    // @ts-ignore
    const showItinerary = window.__SHOW_ITINERARY__ || false;
    // @ts-ignore
    const selectedDay = window.__SELECTED_DAY__ || null;
    // @ts-ignore
    const isGenerating = window.__IS_GENERATING__ || false;
    
    console.log('현재 일정 상태 (DebugPanel):', {
      itinerary,
      showItinerary,
      selectedDay,
      isGenerating,
      // @ts-ignore
      일정길이: itinerary.length
    });
  };
  
  const triggerForceRerender = () => {
    console.log("[DebugPanel] 강제 리렌더링 이벤트 발생");
    window.dispatchEvent(new Event('forceRerender'));
  };
  
  return (
    <div style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
    }}>
      <h3 style={{margin: 0, marginBottom: '5px'}}>디버깅 도구</h3>
      <button onClick={createMockItinerary} style={{padding: '5px', cursor: 'pointer', color: 'black'}}>목업 일정 생성</button>
      <button onClick={dumpCurrentState} style={{padding: '5px', cursor: 'pointer', color: 'black'}}>현재 상태 덤프</button>
      <button onClick={triggerForceRerender} style={{padding: '5px', cursor: 'pointer', color: 'black'}}>강제 리렌더링</button>
    </div>
  );
};

// You'd typically import this into your main App component and conditionally render it:
// import { DebugPanel } from './components/DebugPanel';
// ...
// {process.env.NODE_ENV === 'development' && <DebugPanel isVisible={true} />}
