
import React from 'react';
import DatePicker from './DatePicker';
import { DateRange } from './types';

interface PlannerHeaderProps {
  onDatesSelected: (dates: DateRange) => void;
  dates: DateRange | null;
  onRegionSelect: () => void;
}

const PlannerHeader: React.FC<PlannerHeaderProps> = ({ 
  onDatesSelected, 
  dates, 
  onRegionSelect 
}) => {
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">제주도 여행 플래너</h1>
      <DatePicker onDatesSelected={onDatesSelected} />
      <button
        onClick={() => {
          if (!dates) {
            alert("먼저 날짜를 선택해주세요.");
            return;
          }
          onRegionSelect();
        }}
        className="w-full bg-blue-100 text-blue-800 rounded px-4 py-2 text-sm font-medium hover:bg-blue-200"
      >
        지역 선택
      </button>
    </div>
  );
};

export default PlannerHeader;
