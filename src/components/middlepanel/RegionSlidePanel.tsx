
// RegionSlidePanel.tsx
import React, { useEffect } from 'react';
import RegionSelector from './RegionSelector';
import { AnimatePresence, motion } from 'framer-motion';

interface RegionSlidePanelProps {
  open: boolean;
  onClose: () => void;
  selectedRegions: string[];
  onToggle: (region: string) => void;
  onConfirm: () => void;
}

const RegionSlidePanel: React.FC<RegionSlidePanelProps> = ({
  open,
  onClose,
  selectedRegions,
  onToggle,
  onConfirm,
}) => {
  // ESC 키를 눌렀을 때 패널을 닫는 기능 추가
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="absolute top-0 left-[300px] w-[300px] h-full bg-white border-l shadow-md z-40"
        >
          <RegionSelector
            selectedRegions={selectedRegions}
            onToggle={onToggle}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default RegionSlidePanel;
