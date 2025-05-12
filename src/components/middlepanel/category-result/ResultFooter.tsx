
import React from 'react';
import { Button } from '@/components/ui/button';

interface ResultFooterProps {
  onClose: () => void;
}

const ResultFooter = ({ onClose }: ResultFooterProps) => {
  return (
    <div className="sticky bottom-0 p-4 bg-white border-t">
      <Button onClick={onClose} className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        확인
      </Button>
    </div>
  );
};

export default ResultFooter;
