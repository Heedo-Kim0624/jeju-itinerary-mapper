
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  // Always show 5 page numbers, centered around the current page
  const getPageNumbers = () => {
    const pageNumbers: number[] = [];
    
    // Calculate start and end page numbers
    const groupSize = 5;
    const groupNumber = Math.floor((currentPage - 1) / groupSize);
    const start = groupNumber * groupSize + 1;
    const end = Math.min(start + groupSize - 1, totalPages);
    
    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="pagination-btn"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((number) => (
        <Button
          key={number}
          variant="ghost"
          size="icon"
          className={`pagination-btn ${number === currentPage ? 'active' : ''}`}
          onClick={() => onPageChange(number)}
        >
          {number}
        </Button>
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        className="pagination-btn"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
