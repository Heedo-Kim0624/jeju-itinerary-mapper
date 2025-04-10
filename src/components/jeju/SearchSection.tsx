import React from 'react';
import { Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import DatePicker from '@/components/leftpanel/DatePicker';


interface SearchSectionProps {
  dateRange: {
    startDate: Date | null;
    endDate: Date | null;
    startTime: string;
    endTime: string;
  };
  promptText: string;
  loading: boolean;
  isDateSelectionComplete: boolean;
  onDatesSelected: (dates: {
    startDate: Date;
    endDate: Date;
    startTime: string;
    endTime: string;
  }) => void;
  onPromptChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onSearch: () => void;
}

const SearchSection: React.FC<SearchSectionProps> = ({
  dateRange,
  promptText,
  loading,
  isDateSelectionComplete,
  onDatesSelected,
  onPromptChange,
  onSearch
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-4 animate-fade-in">
      <h2 className="text-lg font-medium mb-4">제주도 여행 플래너</h2>
      
      <div className="mb-4">
        <DatePicker onDatesSelected={onDatesSelected} />
      </div>
      
      <div className="mb-4">
        <Textarea
          placeholder="검색 프롬프트를 입력하세요"
          className="min-h-24 text-sm"
          value={promptText}
          onChange={onPromptChange}
          disabled={!isDateSelectionComplete}
        />
        <Button 
          className="w-full mt-2"
          onClick={onSearch}
          disabled={loading || !isDateSelectionComplete || !promptText.trim()}
        >
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
    </div>
  );
};

export default SearchSection;
