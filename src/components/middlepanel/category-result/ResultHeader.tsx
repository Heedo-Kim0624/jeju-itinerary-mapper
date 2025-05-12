
import React from 'react';

interface ResultHeaderProps {
  category: string;
  onClose: () => void;
}

const ResultHeader = ({ category, onClose }: ResultHeaderProps) => {
  const handleClose = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("ResultHeader - 닫기 버튼 클릭");
    onClose();
  };

  return (
    <header className="sticky top-0 bg-white p-4 border-b flex items-center justify-between">
      <h3 className="text-lg font-semibold">{category} 추천 목록</h3>
      <button 
        onClick={handleClose} 
        className="text-gray-500 hover:text-gray-700"
        type="button"
      >
        닫기
      </button>
    </header>
  );
};

export default ResultHeader;
