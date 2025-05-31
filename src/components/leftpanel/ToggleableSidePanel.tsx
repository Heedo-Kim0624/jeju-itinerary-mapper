
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import LeftPanelContainer from './LeftPanelContainer';
import type { LeftPanelContainerPassedProps } from './types';

interface ToggleableSidePanelProps extends LeftPanelContainerPassedProps {
  children: React.ReactNode;
}

const ToggleableSidePanel: React.FC<ToggleableSidePanelProps> = ({
  children,
  ...leftPanelProps
}) => {
  const [isOpen, setIsOpen] = useState(true);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      {/* Toggle Button - Always visible */}
      <button
        onClick={togglePanel}
        className={`fixed top-4 z-[70] bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-all duration-300 ${
          isOpen ? 'left-[260px]' : 'left-2'
        }`}
        style={{ width: '32px', height: '32px' }}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Side Panel */}
      <div
        className={`fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-[60] shadow-lg transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ width: '300px' }}
      >
        <LeftPanelContainer {...leftPanelProps}>
          <div className="pt-12"> {/* Add padding-top to avoid overlap with toggle button */}
            {children}
          </div>
        </LeftPanelContainer>
      </div>

      {/* Overlay for mobile when panel is open */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-[50] md:hidden"
          onClick={togglePanel}
        />
      )}
    </div>
  );
};

export default ToggleableSidePanel;
