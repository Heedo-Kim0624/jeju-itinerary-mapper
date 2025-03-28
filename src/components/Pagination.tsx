
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
  // Show 5 page numbers at a time
  const getPageNumbers = () => {
    // Calculate the starting page number
    // This will be a multiple of 5, plus 1
    // For example, if currentPage is 7, we want to start from 6
    const startPage = Math.floor((currentPage - 1) / 5) * 5 + 1;
    
    // Calculate the ending page number (start + 4, or totalPages if smaller)
    const endPage = Math.min(startPage + 4, totalPages);
    
    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i);
  };

  const pageNumbers = getPageNumbers();
  const currentGroup = Math.floor((currentPage - 1) / 5);
  const hasPreviousGroup = currentGroup > 0;
  const hasNextGroup = (currentGroup + 1) * 5 < totalPages;

  return (
    <div className="flex items-center justify-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      {pageNumbers.map((number) => (
        <Button
          key={number}
          variant={number === currentPage ? "default" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(number)}
        >
          {number}
        </Button>
      ))}
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};
