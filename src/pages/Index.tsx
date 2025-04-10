import React from 'react';
import LeftPanel from '@/components/leftpanel/LeftPanel';
import RightPanel from '@/components/rightpanel/RightPanel';

const Index: React.FC = () => {
  return (
    <div className="flex h-screen overflow-hidden bg-jeju-light-gray">
      <LeftPanel />
      <RightPanel
        places={[]}
        selectedPlace={null}
        itinerary={null}
        selectedDay={null}
      />
    </div>
  );
};

export default Index;
