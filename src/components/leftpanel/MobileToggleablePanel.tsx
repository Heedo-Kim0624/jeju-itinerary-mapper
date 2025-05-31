
import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MobileToggleablePanelProps {
  children: React.ReactNode;
}

const MobileToggleablePanel: React.FC<MobileToggleablePanelProps> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(true);

  const togglePanel = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative h-full md:hidden">
      {/* 패널 */}
      <div
        className={`absolute top-0 left-0 h-full bg-white border-r border-gray-200 shadow-lg transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'w-[60vw] translate-x-0' : 'w-0 -translate-x-full'
        }`}
      >
        <div className={`h-full overflow-hidden ${isOpen ? 'block' : 'hidden'}`}>
          {children}
        </div>
      </div>

      {/* 토글 버튼 */}
      <button
        onClick={togglePanel}
        className={`fixed top-4 z-50 w-8 h-8 bg-blue-600 text-white rounded-r-md shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out ${
          isOpen ? 'left-[calc(60vw-2rem)]' : 'left-0'
        }`}
      >
        {isOpen ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
    </div>
  );
};

export default MobileToggleablePanel;
