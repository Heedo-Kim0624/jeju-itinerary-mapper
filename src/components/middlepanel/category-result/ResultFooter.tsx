
import React from 'react';
import { Button } from '@/components/ui/button';

interface ResultFooterProps {
  onClose: () => void;
}

const ResultFooter = ({ onClose }: ResultFooterProps) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ResultFooter - 확인 버튼 클릭");
    onClose();
  };

  return (
    <div className="sticky bottom-0 p-4 bg-white border-t">
      <Button 
        onClick={handleClick} 
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
      >
        확인
      </Button>
    </div>
  );
};

export default ResultFooter;
